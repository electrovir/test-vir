import {resolveTestGroupOutput} from '../test-runners/resolve-test-group-output';
import {PromisedTestGroupOutput, ResolvedTestGroupOutput} from '../test-runners/test-group-types';

/**
 * This is used for the CLI only
 */
let globalResults: PromisedTestGroupOutput[] = [];

export function addGlobalResult(input: PromisedTestGroupOutput) {
    globalResults.push(input);
}

/**
 * Make sure this is called after all tests are started or awaited. If called too early, the test
 * results may be incomplete, or (hopefully and usually) simply empty.
 */
export function getAllGlobalResults(): Promise<Readonly<ResolvedTestGroupOutput>>[] {
    const promises = globalResults.map(
        async (
            resultsEntry: PromisedTestGroupOutput,
        ): Promise<Readonly<ResolvedTestGroupOutput>> => {
            return await resolveTestGroupOutput(resultsEntry);
        },
    );
    // clear the results so they don't get double used
    globalResults = [];

    return promises;
}

export function getUnresolvedGlobalResults(): Readonly<PromisedTestGroupOutput[]> {
    return globalResults;
}
