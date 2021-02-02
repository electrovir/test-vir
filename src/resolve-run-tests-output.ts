import {PromisedRunTestsOutput, ResolvedRunTestsOutput} from './run-all-tests-types';

export async function resolveRunTestsOutput(
    unresolved: PromisedRunTestsOutput,
): Promise<ResolvedRunTestsOutput> {
    const allResults = await Promise.all(unresolved.allResults);

    const resolvedResults: ResolvedRunTestsOutput = {
        ...unresolved,
        allResults,
    };

    return resolvedResults;
}
