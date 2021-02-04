import {PromisedTestGroupOutput, ResolvedTestGroupOutput} from './test-group-types';

export async function resolveRunTestsOutput(
    unresolved: PromisedTestGroupOutput,
): Promise<ResolvedTestGroupOutput> {
    const allResults = await Promise.all(unresolved.allResults);

    const resolvedResults: ResolvedTestGroupOutput = {
        ...unresolved,
        allResults,
    };

    return resolvedResults;
}
