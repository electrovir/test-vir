import {testGroup} from '..';

testGroup({
    description: 'my test group',
    tests: (runTest) => {
        runTest({
            // this test will fail if the test callback does not return 5
            expect: 5,
            test: () => {
                // since this function always returns 3, it will always fail the test
                return 3;
            },
        });

        runTest({
            expectError: {
                // this test will pass if the test throws an error which is an instance of class Error
                // AND the error's message matches 'hello there'
                errorClass: Error,
                errorMessage: 'hello there',
            },
            test: () => {
                // since this test always throws an error of class Error, it will always pass the test
                throw new Error('hello there');
            },
        });

        runTest({
            // this is invalid
            // @ts-expect-error
            expect: 4,
            expectError: {
                errorClass: Error,
            },
            test: () => 3,
        });

        runTest({
            // this is invalid
            // @ts-expect-error
            expect: 4,
            test: () => 'hello there',
        });

        runTest({
            // this is valid
            expect: 4,
            test: () => 3,
        });

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
                console.log('nothing to see here');
            },
        });

        // the above test can be written in this way and accomplish the same thing
        runTest(() => {
            console.log('nothing to see here');
        });
    },
});
