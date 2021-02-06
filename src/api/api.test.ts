import {TestError} from '../errors/test-error';
import {createTestGroup} from '../test-runners/test-group';
import {expandGlobs, recursiveRunAllTestFilesErrorMessage, runAllTestFiles} from './api';

createTestGroup({
    description: 'api tests',
    tests: (runTest) => {
        runTest({
            expectError: {
                errorMessage: recursiveRunAllTestFilesErrorMessage,
                errorClass: TestError,
            },
            test: async () => {
                const promisedResults = await runAllTestFiles(['']);
                const resolvedResults = await Promise.all(promisedResults);
                console.log(resolvedResults);
            },
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
                const files = await expandGlobs(['**/*.test.ts']);
                return files.length;
            },
        });
    },
});
