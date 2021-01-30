import {runTests} from './run-tests';
import {TestError} from './test-error';

function main() {
    try {
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
    } catch (error) {
        if (error instanceof TestError) {
            console.log('test succeeded!');
            return true;
        } else {
            throw new Error('Test failed with the wrong error!');
        }
    }

    throw new Error('Test should have failed!');
}

main();
