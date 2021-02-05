import {resolveTestGroupOutput} from '../test-runners/resolve-test-group-output';
import {PromisedTestGroupOutput, ResolvedTestGroupOutput} from '../test-runners/test-group-types';

/**
 * This is used for the CLI only
 */
export const globalResults: PromisedTestGroupOutput[] = [];

/**
 * Make sure this is called after all tests are started or awaited. If called too early, the test
 * results may be incomplete, or (hopefully and usually) simply empty.
 */
export function getAllGlobalResults(): Promise<Readonly<ResolvedTestGroupOutput>>[] {
    return globalResults.map(
        async (
            resultsEntry: PromisedTestGroupOutput,
        ): Promise<Readonly<ResolvedTestGroupOutput>> => {
            return await resolveTestGroupOutput(resultsEntry);
        },
    );
}
