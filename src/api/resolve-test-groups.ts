import {formatIndividualTestResult} from '../formatting/format-individual-test-result';
import {IndividualTestResult} from '../testing/individual-test/individual-test-output';
import {runTestGroups} from '../testing/test-group/run-test-groups';
import {ResolvedTestGroupResults, TestGroupOutput} from '../testing/test-group/test-group-output';

export async function resolveTestGroups(input: TestGroupOutput[] | TestGroupOutput): Promise<void> {
    const groups: TestGroupOutput[] = Array.isArray(input) ? input : [input];

    const results: Promise<ResolvedTestGroupResults>[] = runTestGroups(groups);

    const failures = await results.reduce(
        async (accumulatedErrors: Promise<IndividualTestResult<unknown, unknown>[]>, result) => {
            const failures = (await result).allResults.filter(
                (innerResult) => !innerResult.success,
            );

            return (await accumulatedErrors).concat(failures);
        },
        Promise.resolve([]),
    );

    const failureMessages = failures.map((failure) => formatIndividualTestResult(failure));

    if (failureMessages.length) {
        throw new Error(failureMessages.join('\n'));
    }
}
