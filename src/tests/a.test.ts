import {runTests} from '../run-all-tests';

runTests({
    description: 'test the tester',
    tests: (runTest) => {
        runTest({
            expect: 'This should fail',
            test: () => {
                return 'non matching string';
            },
        });
    },
});
