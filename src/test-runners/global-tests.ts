import {TestGroupOutput} from './test-group-types';

/**
 * This is used for the CLI only
 */
let globalTests: TestGroupOutput[] = [];

export function addGlobalTest(input: TestGroupOutput) {
    globalTests.push(input);
}

/**
 * Make sure this is called after all tests are started or awaited. If called too early, the test
 * results may be incomplete, or (hopefully and usually) simply empty.
 */
export function getAndClearGlobalTests(): TestGroupOutput[] {
    const tests = globalTests;
    // clear the results so they don't get double used
    globalTests = [];

    return tests;
}
