import {TestGroupOutput} from './test-group-types';

/** This is used for the CLI only */
let globalTests: Promise<TestGroupOutput>[] = [];

export function addGlobalTest(input: Promise<TestGroupOutput>) {
    globalTests.push(input);
}

/**
 * Make sure this is called after all tests are started or awaited. If called too early, the test
 * results may be incomplete, or (hopefully and usually) simply empty.
 */
export async function getAndClearGlobalTests(): Promise<TestGroupOutput[]> {
    const rawTests = globalTests;
    // clear the results so they don't get double used
    clearGlobalTests();

    const tests: TestGroupOutput[] = await Promise.all(rawTests);

    return tests;
}

export function clearGlobalTests(): void {
    globalTests = [];
}
