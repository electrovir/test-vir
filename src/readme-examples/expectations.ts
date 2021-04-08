// expectations.ts
import {testGroup} from '..';

testGroup({
    description: 'expectations test group',
    tests: (runTest) => {
        // expectations.ts
        // expectError examples
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

        // expectations.ts
        // expect and expectError example
        runTest({
            // this is invalid
            // @ts-expect-error
            expect: 4,
            expectError: {
                errorClass: Error,
            },
            test: () => 3,
        });

        // expectations.ts
        // expect vs return value expectation example
        runTest({
            // this is invalid because the test function has a return type of string but expect has
            // a type of number
            // @ts-expect-error
            expect: 4,
            test: () => 'hello there',
        });
        runTest({
            // this is valid because both the test function and expect have the type number
            expect: 4,
            test: () => 3,
        });

        // expectations.ts
        // expect and void return type example
        runTest({
            // this is invalid because the types don't match
            // @ts-expect-error
            expect: 4,
            test: () => {},
        });

        runTest({
            // this test has no return value so it cannot be expected to return anything
            // this test will pass if it simply throws no errors
            test: () => {
                // nothing to see here
            },
        });

        // the above test can be written in this way and accomplish the same thing
        runTest(() => {
            // nothing to see here
        });
    },
});
