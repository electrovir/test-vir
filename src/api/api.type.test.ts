import {ResolvedTestGroupOutput, runAllTestFiles, runResolvedTestFiles} from '..';

// this is for type errors, this function will never actually run
async function main() {
    // array of promises so that each can be handled once it's resolved
    const promisedOneByOneResults = await runAllTestFiles(['']);
    const resolvedOneByOneResults: Readonly<ResolvedTestGroupOutput>[] = await Promise.all(
        promisedOneByOneResults,
    );

    // passing in true will result in all array elements being awaited already
    const promisedAllResults: Readonly<ResolvedTestGroupOutput>[] = await runResolvedTestFiles([
        '',
    ]);

    // should be an array of promises
    // @ts-expect-error
    const wrongTypeArray: Readonly<ResolvedTestGroupOutput>[] = await runAllTestFiles(['']);
}
