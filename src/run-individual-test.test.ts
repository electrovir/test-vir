import {ResultState} from './result-state';
import {runIndividualTest} from './run-individual-test';
import {createTestGroup} from './test-group';

createTestGroup({
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
                throw new Error('herp derp');
            },
        });
    },
});

createTestGroup({
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
