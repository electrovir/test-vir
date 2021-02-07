import {testGroup} from '..';

testGroup({
    // description is required for all every call to testGroup
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
