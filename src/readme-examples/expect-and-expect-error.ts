import {testGroup} from '..';

testGroup({
    description: 'invalid expect and expectError example',
    tests: (runTest) => {
        // this is invalid
        runTest({
            // @ts-expect-error
            expect: 4,
            expectError: {
                errorClass: Error,
            },
            test: () => 3,
        });
    },
});
