import {ResolvedTestGroupResults} from '../../';
import {runAllTestFiles, runResolvedTestFiles} from '../../api/api';

// this is for type errors, this function will never actually run
async function main() {
    // array of promises so that each can be handled once it's resolved
    const promisedOneByOneResults = await runAllTestFiles(['']);
    // const resolvedOneByOneResults: Readonly<
    //     ResolvedTestGroupResults
    // >[] = await resolveTestGroupResults(promisedOneByOneResults);

    // passing in true will result in all array elements being awaited already
    const promisedAllResults: Readonly<ResolvedTestGroupResults>[] = await runResolvedTestFiles([
        '',
    ]);

    // should be an array of promises
    const wrongTypeArray: Readonly<ResolvedTestGroupResults>[] = await runAllTestFiles(['']);
}
