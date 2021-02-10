import {resolve} from 'path';
import {EmptyTestGroupError} from '../errors/empty-test-group-error';
import {FileNotFoundError} from '../errors/file-not-found-error';
import {FileNotUsedError} from '../errors/file-not-used-error';
import {throwInternalTestVirError} from '../errors/internal-test-vir-error';
import {Caller, emptyCaller} from '../get-caller-file';
import {ResultState} from './result-state';
import {isTestObject, runIndividualTest} from './run-individual-test';
import {
    FilteredTestGroupOutput,
    FilteredWrappedTest,
    IgnoredReason,
    PromisedResult,
    PromisedTestGroupResults,
    ResolvedTestGroupResults,
    TestGroupOutput,
    WrappedTest,
} from './test-group-types';

export async function resolveTestGroupResults(
    input: PromisedTestGroupResults,
): Promise<ResolvedTestGroupResults>;
export async function resolveTestGroupResults(
    input: PromisedTestGroupResults[],
): Promise<ResolvedTestGroupResults[]>;
export async function resolveTestGroupResults(
    input: PromisedTestGroupResults[] | PromisedTestGroupResults,
): Promise<ResolvedTestGroupResults[] | ResolvedTestGroupResults> {
    const groups: PromisedTestGroupResults[] = Array.isArray(input) ? input : [input];

    const promises = await Promise.all(
        groups.map(async (testGroupResult) => {
            const resolvedResults = await Promise.all(testGroupResult.allResults);

            return {
                ...testGroupResult,
                allResults: resolvedResults,
            };
        }),
    );

    return Array.isArray(input) ? promises : promises[0]!;
}

export async function runTestGroups(
    testGroups: TestGroupOutput[],
    files?: {found: string[]; lost: string[]},
): Promise<PromisedTestGroupResults[]> {
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
        return allTestGroups.map((testGroup) => {
            if (testGroup.ignoredReason == undefined) {
                const allResults: PromisedResult[] = testGroup.tests.map(
                    (test): PromisedResult => {
                        if (test.ignoredReason == undefined) {
                            return runIndividualTest(test.input);
                        } else {
                            return Promise.resolve({
                                caller: undefined,
                                input: test.input,
                                output: undefined,
                                error: undefined,
                                resultState: ResultState.Ignored,
                                success: true,
                            });
                        }
                    },
                );
                if (allResults.length) {
                    return {
                        ...testGroup,
                        allResults,
                    };
                } else {
                    return {
                        ...testGroup,
                        description: 'Test group contained no tests',
                        allResults: createEmptyTestGroupFailure(testGroup.caller),
                    };
                }
            } else {
                return {
                    ...testGroup,
                    allResults: [],
                };
            }
        });
    } catch (error) {
        throwInternalTestVirError(`Error encountered while running tests: ${error}`);
    }
}

function createEmptyTestGroupFailure(caller: Caller): PromisedResult[] {
    return [
        Promise.resolve({
            caller: caller,
            input: undefined,
            output: undefined,
            error: new EmptyTestGroupError(),
            resultState: ResultState.Error,
            success: false,
        }),
    ];
}

function createLostFileGroups(lostFiles: string[]): FilteredTestGroupOutput[] {
    return lostFiles.map(
        (lostFilePath): FilteredTestGroupOutput => {
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
        },
    );
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
