import {testGroup} from '..';

testGroup({
    description: 'expectError examples',
    tests: (runTest) => {
        runTest({
            expectError: {
                // this test will pass if the test throws an error which is an instance of class Error
                // AND the error's message matches 'hello there'
                errorClass: Error,
                errorMessage: 'hello there',
            },
            test: () => {
                // since this test always throws an error of class Error and message of 'hello there',
                // it will always pass the test
                throw new Error('hello there');
            },
        });
        runTest({
            expectError: {
                // this test will pass if the test throws an error which is an instance of class Error
                errorClass: Error,
            },
            test: () => {
                // since this test always throws an error of class Error, it will always pass the test
                throw new Error('hello there');
            },
        });
        runTest({
            expectError: {
                // this test will pass if the test throws an error with a message that matches 'hello there'
                errorMessage: 'hello there',
            },
            test: () => {
                // since this test always throws an error with message 'hello there', it will always
                // pass the test
                throw new Error('hello there');
            },
        });
    },
});
