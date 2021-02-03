import {ResultState} from '../result-state';
import {runTests} from '../run-all-tests';
import {runIndividualTest} from '../run-individual-test';

runTests({
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
    },
});

runTests({
    description: 'test the tester 2',
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
