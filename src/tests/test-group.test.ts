import {testGroup} from '../test-runners/test-group';
import {TestGroupOutput} from '../test-runners/test-group-types';

testGroup((runTest) => {
    runTest({
        description: 'testGroup output has tests when synchronous',
        expect: 1,
        test: async () => {
            const output: TestGroupOutput = testGroup({
                description: 'thing',
                tests: (runTest) => {
                    runTest(() => {
                        //stuff
                    });
                },
            });

            return output.tests.length;
        },
    });

    runTest({
        description: 'testGroup output has tests when asynchronous',
        expect: 1,
        test: async () => {
            const output: TestGroupOutput = await testGroup({
                description: 'thing',
                tests: async (runTest) => {
                    await Promise.resolve();
                    runTest(() => {
                        //stuff
                    });
                },
            });

            return output.tests.length;
        },
    });

    runTest({
        description: 'error in async testGroup gets caught',
        expectError: {
            errorMessage: 'who done it',
        },
        test: async () => {
            const output: TestGroupOutput = await testGroup({
                description: 'thing',
                tests: async (runTest) => {
                    throw new Error('who done it');
                },
            });

            return output.tests.length;
        },
    });

    runTest({
        description: 'test stops when testGroup callback has error',
        expectError: {
            errorMessage: 'Error while running testGroup: "Error: blah blah blah blah"',
        },
        test: async () => {
            const output: TestGroupOutput = await testGroup({
                description: 'thing',
                tests: () => {
                    throw new Error('blah blah blah blah');
                },
            });

            return output.tests.length;
        },
    });
});
