import {resolve} from 'path';
import {formatIndividualTestResults} from '../api/format-results';
import {EmptyTestGroupError} from '../errors/empty-test-group-error';
import {FileNotFoundError} from '../errors/file-not-found-error';
import {FileNotUsedError} from '../errors/file-not-used-error';
import {throwInternalTestVirError} from '../errors/internal-test-vir-error';
import {Caller, emptyCaller} from '../get-caller-file';
import {ResultState} from './result-state';
import {isTestObject, runIndividualTest} from './run-individual-test';
import {IndividualTestResult} from './run-individual-test-types';
import {
    FilteredTestGroupOutput,
    FilteredWrappedTest,
    IgnoredReason,
    ResolvedTestGroupResults,
    TestGroupOutput,
    WrappedTest,
} from './test-group-types';

export async function resolveTestGroup(input: TestGroupOutput[] | TestGroupOutput): Promise<void> {
    const groups: TestGroupOutput[] = Array.isArray(input) ? input : [input];

    const results: ResolvedTestGroupResults[] = await runTestGroups(groups);

    const failures = results.reduce(
        (accumulatedErrors: IndividualTestResult<unknown, unknown>[], result) => {
            const failures = result.allResults.filter((innerResult) => !innerResult.success);

            return accumulatedErrors.concat(failures);
        },
        [],
    );

    const failureMessages = failures.map((failure) => formatIndividualTestResults(failure));

    if (failureMessages.length) {
        throw new Error(failureMessages.join('\n'));
    }
}

export async function runTestGroups(
    testGroups: TestGroupOutput[],
    files?: {found: string[]; lost: string[]},
): Promise<ResolvedTestGroupResults[]> {
    const lostFileTestGroups = createLostFileGroups(files ? files.lost : []);
    const filteredTestGroups = filterTestGroups(testGroups);
    const unusedFileTestGroups = getUnusedFileErrorGroups(
        files ? files.found : [],
        filteredTestGroups,
    );

    const allTestGroups: FilteredTestGroupOutput[] = [
        ...filteredTestGroups,
        ...unusedFileTestGroups,
        ...lostFileTestGroups,
    ];

    try {
        return await allTestGroups.reduce(async (allTestGroupsPromise, testGroup) => {
            const allTestGroups = await allTestGroupsPromise;
            if (testGroup.ignoredReason == undefined) {
                const allResults: IndividualTestResult<unknown, unknown>[] =
                    await testGroup.tests.reduce(async (allInternalResultsPromise, test) => {
                        const allInternalResults = await allInternalResultsPromise;

                        if (test.ignoredReason == undefined) {
                            return allInternalResults.concat(await runIndividualTest(test.input));
                        } else {
                            return allInternalResults.concat({
                                caller: undefined,
                                input: test.input,
                                output: undefined,
                                error: undefined,
                                resultState: ResultState.Ignored,
                                success: true,
                            });
                        }
                    }, Promise.resolve([] as IndividualTestResult<unknown, unknown>[]));
                if (allResults.length) {
                    return allTestGroups.concat({
                        ...testGroup,
                        allResults,
                    });
                } else {
                    return allTestGroups.concat({
                        ...testGroup,
                        description: 'Test group contained no tests',
                        allResults: createEmptyTestGroupFailure(testGroup.caller),
                    });
                }
            } else {
                return allTestGroups.concat({
                    ...testGroup,
                    allResults: [],
                });
            }
        }, Promise.resolve([] as ResolvedTestGroupResults[]));
    } catch (error) {
        throwInternalTestVirError(`Error encountered while running tests: ${error}`);
    }
}

function createEmptyTestGroupFailure(caller: Caller): IndividualTestResult<unknown, unknown>[] {
    return [
        {
            caller: caller,
            input: undefined,
            output: undefined,
            error: new EmptyTestGroupError(),
            resultState: ResultState.Error,
            success: false,
        },
    ];
}

function createLostFileGroups(lostFiles: string[]): FilteredTestGroupOutput[] {
    return lostFiles.map((lostFilePath): FilteredTestGroupOutput => {
        const lostFileCaller = {...emptyCaller, filePath: lostFilePath};

        return {
            caller: lostFileCaller,
            description: 'File not found',
            exclude: false,
            forceOnly: false,
            tests: [
                {
                    input: () => {
                        throw new FileNotFoundError(`File not found: ${lostFilePath}`);
                    },
                    caller: lostFileCaller,
                    ignoredReason: undefined,
                },
            ],
            ignoredReason: undefined,
        };
    });
}

function getUnusedFileErrorGroups(
    filePaths: string[],
    results: Readonly<FilteredTestGroupOutput>[],
): Readonly<FilteredTestGroupOutput>[] {
    const foundFilesSet = new Set(results.map((result) => resolve(result.caller.filePath)));

    const unusedFiles = filePaths.filter((filePath) => {
        return !foundFilesSet.has(resolve(filePath));
    });

    return unusedFiles.map((unusedFilePath) => {
        const unusedFileCaller = {...emptyCaller, filePath: unusedFilePath};
        return {
            tests: [
                {
                    input: () => {
                        throw new FileNotUsedError(`File contained no tests: ${unusedFilePath}`);
                    },
                    ignoredReason: undefined,
                    caller: unusedFileCaller,
                },
            ],
            description: 'File contains no tests',
            exclude: false,
            forceOnly: false,
            caller: unusedFileCaller,
            ignoredReason: undefined,
        };
    });
}

type AlmostFilteredTestGroupOutput = Omit<FilteredTestGroupOutput, 'ignoredReason'>;

function setIgnored(
    input: AlmostFilteredTestGroupOutput,
    reason: IgnoredReason | undefined,
): FilteredTestGroupOutput;
function setIgnored(input: WrappedTest, reason: IgnoredReason | undefined): FilteredWrappedTest;
function setIgnored(
    input: WrappedTest | AlmostFilteredTestGroupOutput,
    reason: IgnoredReason | undefined,
): typeof input extends WrappedTest ? FilteredWrappedTest : FilteredTestGroupOutput;
function setIgnored(
    input: WrappedTest | AlmostFilteredTestGroupOutput,
    reason: IgnoredReason | undefined,
): FilteredWrappedTest | FilteredTestGroupOutput {
    return {
        ...input,
        ignoredReason: reason,
    };
}

function combineTests({
    forced,
    nonExcluded,
    excluded,
}: {
    forced: WrappedTest[];
    nonExcluded: WrappedTest[];
    excluded: WrappedTest[];
}): FilteredWrappedTest[];
function combineTests({
    forced,
    nonExcluded,
    excluded,
}: {
    forced: AlmostFilteredTestGroupOutput[];
    nonExcluded: AlmostFilteredTestGroupOutput[];
    excluded: AlmostFilteredTestGroupOutput[];
}): FilteredTestGroupOutput[];
function combineTests({
    forced,
    nonExcluded,
    excluded,
}: {
    forced: (AlmostFilteredTestGroupOutput | WrappedTest)[];
    nonExcluded: (AlmostFilteredTestGroupOutput | WrappedTest)[];
    excluded: (AlmostFilteredTestGroupOutput | WrappedTest)[];
}): FilteredTestGroupOutput[] | FilteredWrappedTest[] {
    return [
        ...(forced.length
            ? [
                  ...forced.map((test) => setIgnored(test, undefined)),
                  ...nonExcluded.map((test) => setIgnored(test, IgnoredReason.NonForced)),
              ]
            : [...forced, ...nonExcluded].map((test) => setIgnored(test, undefined))),
        ...excluded.map((test) => setIgnored(test, IgnoredReason.Excluded)),
    ];
}

export function filterTestGroups(testGroups: TestGroupOutput[]): FilteredTestGroupOutput[] {
    const nonExcludedGroups: AlmostFilteredTestGroupOutput[] = [];
    const forcedGroups: AlmostFilteredTestGroupOutput[] = [];
    const excludedGroups: AlmostFilteredTestGroupOutput[] = [];

    testGroups.forEach((testGroup) => {
        const nonExcludedTests: WrappedTest[] = [];
        const forcedTests: WrappedTest[] = [];
        const excludedTests: WrappedTest[] = [];

        testGroup.tests.forEach((wrappedTest) => {
            if (isTestObject(wrappedTest.input)) {
                if (wrappedTest.input.forceOnly) {
                    forcedTests.push(wrappedTest);
                } else if (wrappedTest.input.exclude) {
                    excludedTests.push(wrappedTest);
                } else {
                    nonExcludedTests.push(wrappedTest);
                }
            } else {
                nonExcludedTests.push(wrappedTest);
            }
        });

        const combinedTests: FilteredWrappedTest[] = combineTests({
            forced: forcedTests,
            excluded: excludedTests,
            nonExcluded: nonExcludedTests,
        });

        const newTests: AlmostFilteredTestGroupOutput = {
            ...testGroup,
            tests: combinedTests,
        };

        if (forcedTests.length || testGroup.forceOnly) {
            forcedGroups.push(newTests);
        } else if (testGroup.exclude) {
            excludedGroups.push(newTests);
        } else {
            nonExcludedGroups.push(newTests);
        }
    });

    return combineTests({
        forced: forcedGroups,
        excluded: excludedGroups,
        nonExcluded: nonExcludedGroups,
    });
}
