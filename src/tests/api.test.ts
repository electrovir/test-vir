import {runAllTestFiles, TestError, testGroup} from '..';
import {expandGlobs, recursiveRunAllTestFilesErrorMessage} from '../api/api';

// the most basic of tests

testGroup((runTest) => {
    runTest({
        expect: 'this should pass just fine',
        test: () => {
            return 'this should pass just fine';
        },
    });
    runTest(() => {
        // this one will also pass because it doesn't do anything
    });
});

// testGroup should work with an async input
testGroup(async (runTest) => {
    await Promise.resolve();

    runTest(async () => {
        await Promise.resolve();
    });
});

testGroup((runTest) => {
    runTest(() => {
        // do nothing
    });
});

testGroup({
    description: 'api tests',
    tests: (runTest) => {
        runTest({
            expectError: {
                errorMessage: recursiveRunAllTestFilesErrorMessage,
                errorClass: TestError,
            },
            test: async () => await runAllTestFiles(['']),
        });
        runTest({
            expect: 1,
            description: "non glob syntax doesn't match anything",
            test: async () => {
                const files = await expandGlobs(['.test.ts']);
                return files.length;
            },
        });
        runTest({
            expect: -1,
            description: 'excluded test with failure should not fail the tests',
            test: async () => {
                const files = await expandGlobs(['.test.ts']);
                return files.length;
            },
            // intentionally excluded, that is part of the test
            exclude: true,
        });
        runTest({
            expect: 1,
            description: 'should exclude test even if it throws error',
            test: async () => {
                throw new Error();
            },
            // intentionally excluded, that is part of the test
            exclude: true,
        });
        runTest({
            expect: [__filename],
            description: 'duplicate files are excluded',
            test: async () => {
                const files = await expandGlobs([__filename, __filename, __filename]);
                return files;
            },
        });
        runTest({
            expect: 5,
            description: 'glob syntax expands',
            test: async () => {
                const files = await expandGlobs(['./**/!(*.type).test.js']);
                return files.length;
            },
        });

        testGroup((runTest) =>
            runTest({
                description: 'undefined expectError should work fine',
                expectError: undefined,
                expect: undefined,
                test: () => {},
            }),
        );

        testGroup((runTest) =>
            runTest({
                description: 'undefined expectError along with expect should work fine',
                expectError: undefined,
                expect: '',
                test: () => '',
            }),
        );
    },
});
