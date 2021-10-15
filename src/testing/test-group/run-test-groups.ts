import {throwInternalTestVirError} from '../../errors/internal-test-vir.error';
import {IndividualTestResult} from '../individual-test/individual-test-output';
import {runIndividualTest} from '../individual-test/run-individual-test';
import {ResultState} from '../result-state';
import {filterTestGroups} from './filter-test-groups';
import {createEmptyTestGroupFailure, createLostFileGroups} from './invalid-groups';
import {
    FilteredTestGroupOutput,
    ResolvedTestGroupResults,
    TestGroupOutput,
} from './test-group-output';

export function runTestGroups(
    testGroups: TestGroupOutput[],
    files?: {found: string[]; lost: string[]},
): Promise<ResolvedTestGroupResults>[] {
    const lostFileTestGroups = createLostFileGroups(files ? files.lost : []);
    const filteredTestGroups = filterTestGroups(testGroups);

    const allTestGroups: FilteredTestGroupOutput[] = [...filteredTestGroups, ...lostFileTestGroups];

    try {
        return allTestGroups.map(async (testGroup) => {
            const testGroupResult: ResolvedTestGroupResults = await runTestGroup(testGroup);

            return testGroupResult;
        }, Promise.resolve([] as ResolvedTestGroupResults[]));
    } catch (error) {
        throwInternalTestVirError(`Error encountered while running tests: ${error}`);
    }
}

async function runTestGroup(testGroup: FilteredTestGroupOutput): Promise<ResolvedTestGroupResults> {
    if (testGroup.ignoredReason == undefined) {
        const allResults: IndividualTestResult<unknown, unknown>[] = await testGroup.tests.reduce(
            async (allInternalResultsPromise, test) => {
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
            },
            Promise.resolve([] as IndividualTestResult<unknown, unknown>[]),
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
}
