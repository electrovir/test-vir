import {testGroup} from '..';

testGroup({
    description: 'return type mismatch example',
    tests: (runTest) => {
        runTest({
            /**
             * This is invalid because the test function has a return type of string but expect has
             * a type of number.
             */
            // @ts-expect-error
            expect: 4,
            test: () => 'hello there',
        });
        runTest({
            /** This is valid because both the test function and expect have the type of number. */
            expect: 4,
            test: () => 3,
        });
    },
});
