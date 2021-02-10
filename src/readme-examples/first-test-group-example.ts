// first-test-group-example.ts
import {testGroup} from '..';

testGroup({
    description: 'my test group',
    tests: (runTest) => {
        runTest({
            expect: 5,
            test: () => {
                // this test will always fail because 3 !== 5
                return 3;
            },
        });
    },
});
