import {ResultState, testGroup} from '../..';
import {runIndividualTest} from './run-individual-test';

testGroup({
    description: 'test the tester',
    tests: (runTest) => {
        runTest({
            expect: ResultState.ExpectMatchFail,
            test: async () =>
                (
                    await runIndividualTest({
                        expect: 'This should fail',
                        test: () => {
                            return 'non matching string';
                        },
                    })
                ).resultState,
        });
        runTest({
            expect: ResultState.ExpectMatchPass,
            test: async () =>
                (
                    await runIndividualTest({
                        expect: 'This should pass',
                        test: () => {
                            return 'This should pass';
                        },
                    })
                ).resultState,
        });
        runTest({
            expectError: {
                errorClass: Error,
            },
            description: 'test with error expect',
            test: async () => {
                throw new Error();
            },
        });
        runTest({
            // this tests that we print output in the api as tests finish, not waiting till the end
            description: 'long test',
            test: async () => {
                return new Promise<void>((resolve) => {
                    setTimeout(() => resolve(), 100);
                });
            },
        });
        runTest({
            description: 'async error test',
            expectError: {
                errorClass: Error,
            },
            test: async () => {
                return new Promise<void>((_, reject) => {
                    reject(new Error());
                });
            },
        });
        runTest({
            description: 'test regexp error message expectation',
            expectError: {
                errorMessage: /something\d+/,
            },
            test: async () => {
                return new Promise<void>((_, reject) => {
                    reject(new Error('something' + (100 * Math.random()).toFixed(0)));
                });
            },
        });
    },
});

testGroup({
    description: 'second test in file',
    tests: (runTest) => {
        runTest({
            expect: ResultState.ExpectMatchFail,
            test: async () =>
                (
                    await runIndividualTest({
                        expect: 'This should fail',
                        test: () => {
                            return 'non matching string';
                        },
                    })
                ).resultState,
        });
    },
});
