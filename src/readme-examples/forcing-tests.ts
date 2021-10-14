import {testGroup} from '..';

// this test group will not appear in the results because the other group is forced
testGroup({
    description: 'my excluded test group',
    tests: (runTest) => {
        runTest({
            expect: 5,
            test: () => {
                return 3;
            },
        });
    },
});

testGroup({
    description: 'my forced test group',
    tests: (runTest) => {
        runTest({
            // this runTest will be included in the results
            forceOnly: true,
            expect: 'hello there',
            test: () => {
                return 'hello there';
            },
        });
        // this runTest will not be included because the one above is forced
        runTest({
            expect: 5,
            test: () => {
                return 3;
            },
        });
    },
});
