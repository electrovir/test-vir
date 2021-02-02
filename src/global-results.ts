import {resolveRunTestsOutput} from './resolve-run-tests-output';
import {PromisedRunTestsOutput, ResolvedRunTestsOutput} from './run-all-tests-types';

/**
 * This is used for the CLI only
 */
export const globalResults: PromisedRunTestsOutput[] = [];

/**
 * Make sure this is called after all tests are started or awaited. If called too early, the test
 * results may be incomplete, or (hopefully and usually) simply empty.
 */
export async function getGlobalResults(): Promise<Readonly<ResolvedRunTestsOutput[]>> {
    return Promise.all(
        globalResults.map(
            (resultsEntry: PromisedRunTestsOutput): Promise<Readonly<ResolvedRunTestsOutput>> => {
                return resolveRunTestsOutput(resultsEntry);
            },
        ),
    );
}
