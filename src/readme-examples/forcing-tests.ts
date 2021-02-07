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

// this test group will appear in the results
testGroup({
    description: 'my excluded test group',
    tests: (runTest) => {
        // this runTest will be included in the results
        runTest({
            expect: 'hello there',
            test: () => {
                return 'hello there';
            },
            forceOnly: true,
        });
        // this runTest will not be included because the one above is forced
        runTest({
            expect: 5,
            test: () => {
                return 3;
            },
        });
    },
    forceOnly: true,
});
