import {testGroup} from '..';

testGroup({
    description: 'my excluded test group',
    // this test group will not appear in the results because it is excluded
    exclude: true,
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
    description: 'my not excluded test group',
    tests: (runTest) => {
        runTest({
            expect: 'hello there',
            test: () => {
                return 'hello there';
            },
        });
        runTest({
            // this runTest will not appear in the results because it is excluded
            exclude: true,
            expect: 5,
            test: () => {
                return 3;
            },
        });
    },
});
