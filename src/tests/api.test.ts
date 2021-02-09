import {runAllTestFiles, TestError, testGroup} from '..';
import {expandGlobs, recursiveRunAllTestFilesErrorMessage} from '../api/api';

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
            expect: 1,
            description: "non glob syntax doesn't match anything",
            test: async () => {
                const files = await expandGlobs(['.test.ts']);
                return files.length;
            },
            exclude: true,
        });
        runTest({
            expect: 1,
            description: 'should exclude test even if it throws error',
            test: async () => {
                const files = await expandGlobs(['.test.ts']);
                throw new Error();
                return files.length;
            },
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
            expect: 3,
            description: 'glob syntax expands',
            test: async () => {
                const files = await expandGlobs(['./**/!(*.type).test.js']);
                return files.length;
            },
        });
    },
});
