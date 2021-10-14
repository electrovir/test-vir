import {testGroup} from '..';

testGroup({
    description: 'void return example',
    tests: (runTest) => {
        runTest({
            // this is invalid because the types don't match
            // @ts-expect-error
            expect: 4,
            test: () => {},
        });
    },
});
