// EXAMPLES

// when installed via npm this line should be
// import {testGroup} from 'test-vir';
import {testGroup} from '..';

// testGroup call must happen first, runTest is then accessed in the "tests" callback.
testGroup({
    description: 'example tests',
    tests: (runTest) => {
        // just a function as the input with no return value.
        runTest(() => {
            checkThatSomethingWorks();
        });
        // object input with no return value
        runTest({
            test: () => {
                checkThatSomethingWorks();
            },
        });
        // type of expect must match the return type of the test function
        runTest({
            test: () => {
                return checkThatSomethingWorks();
            },
            expect: 'worked',
        });
        // optional object input parameters
        runTest({
            test: () => {
                return checkThatSomethingWorks();
            },
            expect: 'worked',
        });
    },
});

testGroup({
    description: 'excluded tests',
    tests: (runTest) => {
        runTest(() => {
            checkThatSomethingWorks();
        });
    },
    exclude: true,
});

testGroup({
    description: 'only run these tests, exclude all other tests',
    tests: (runTest) => {
        runTest(() => {
            checkThatSomethingWorks();
        });
    },
    forceOnly: true,
});

function checkThatSomethingWorks() {
    return 'worked';
}
