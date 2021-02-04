import {resolveRunTestsOutput} from './resolve-run-tests-output';
import {PromisedTestGroupOutput, ResolvedTestGroupOutput} from './test-group-types';

/**
 * This is used for the CLI only
 */
export const globalResults: PromisedTestGroupOutput[] = [];

/**
 * Make sure this is called after all tests are started or awaited. If called too early, the test
 * results may be incomplete, or (hopefully and usually) simply empty.
 */
export async function getGlobalResults(): Promise<Readonly<ResolvedTestGroupOutput[]>> {
    return Promise.all(
        globalResults.map(
            (resultsEntry: PromisedTestGroupOutput): Promise<Readonly<ResolvedTestGroupOutput>> => {
                return resolveRunTestsOutput(resultsEntry);
            },
        ),
    );
}
