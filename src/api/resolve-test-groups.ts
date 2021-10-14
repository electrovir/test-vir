import {formatIndividualTestResult} from '../formatting/format-individual-test-result';
import {IndividualTestResult} from '../testing/individual-test/individual-test-output';
import {runTestGroups} from '../testing/test-group/run-test-groups';
import {ResolvedTestGroupResults, TestGroupOutput} from '../testing/test-group/test-group-output';

export async function resolveTestGroups(input: TestGroupOutput[] | TestGroupOutput): Promise<void> {
    const groups: TestGroupOutput[] = Array.isArray(input) ? input : [input];

    const results: ResolvedTestGroupResults[] = await runTestGroups(groups);

    const failures = results.reduce(
        (accumulatedErrors: IndividualTestResult<unknown, unknown>[], result) => {
            const failures = result.allResults.filter((innerResult) => !innerResult.success);

            return accumulatedErrors.concat(failures);
        },
        [],
    );

    const failureMessages = failures.map((failure) => formatIndividualTestResult(failure));

    if (failureMessages.length) {
        throw new Error(failureMessages.join('\n'));
    }
}
