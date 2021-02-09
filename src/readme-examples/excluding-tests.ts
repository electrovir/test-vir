// excluding-tests.ts
import {testGroup} from '..';

// this test group will not appear in the results because it is excluded
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
    exclude: true,
});

// this test group will appear in the results
testGroup({
    description: 'my excluded test group',
    tests: (runTest) => {
        runTest({
            expect: 'hello there',
            test: () => {
                return 'hello there';
            },
        });
        runTest({
            expect: 5,
            test: () => {
                return 3;
            },
            // this runTest will not appear in the results because it is excluded
            exclude: true,
        });
    },
});
