import {existsSync} from 'fs';
import {throwInternalTestVirError} from '../errors/internal-test-vir.error';
import {TestError} from '../errors/test.error';
import {clearGlobalTests} from '../testing/test-group/global-test-groups';
import {runTestGroups} from '../testing/test-group/run-test-groups';
import {ResolvedTestGroupResults} from '../testing/test-group/test-group-output';
import {generatedFailedImportResults} from './imports/failed-import';
import {expandGlobs} from './imports/glob';
import {handleImports} from './imports/import-test-files';
import {getUnusedFileErrorResults} from './imports/unused-imports';

let alreadyRunning = false;

export const recursiveRunAllTestFilesErrorMessage = `${runTestFiles.name} cannot be running inside of itself!`;

export async function runTestFilesWithoutResolvingThem(
    inputFiles: string[],
): Promise<(Promise<ResolvedTestGroupResults> | ResolvedTestGroupResults)[]> {
    const files = await expandGlobs(inputFiles);

    const {foundFiles, lostFiles} = files.reduce(
        (accum: {foundFiles: string[]; lostFiles: string[]}, currentFile) => {
            if (existsSync(currentFile)) {
                accum.foundFiles.push(currentFile);
            } else {
                accum.lostFiles.push(currentFile);
            }
            return accum;
        },
        {foundFiles: [], lostFiles: []},
    );
    // clear out before running tests
    clearGlobalTests();
    const {importFailures, emptyFiles, testGroups} = await handleImports(foundFiles);

    const failedImportFiles = importFailures.map((failure) => failure.filePath);

    const resultPromises: (Promise<ResolvedTestGroupResults> | ResolvedTestGroupResults)[] =
        runTestGroups(testGroups, {
            found: foundFiles.filter((file) => !failedImportFiles.includes(file)),
            lost: lostFiles,
        });

    const failedImportResults: ResolvedTestGroupResults[] =
        generatedFailedImportResults(importFailures);
    const emptyFileResults: ResolvedTestGroupResults[] = getUnusedFileErrorResults(emptyFiles);

    return resultPromises.concat(failedImportResults, emptyFileResults);
}

/**
 * Runs test files and fully resolves all of them in serial to prevent them from tripping on each
 * others toes, like when doing file system operations.
 */
export async function runTestFiles(
    inputFiles: string[],
    testResultCallback?: (result: ResolvedTestGroupResults) => void | Promise<void>,
): Promise<ResolvedTestGroupResults[]> {
    // prevent this function from running inside of itself as this will mess up the results
    if (alreadyRunning) {
        throw new TestError(recursiveRunAllTestFilesErrorMessage);
    } else {
        alreadyRunning = true;
    }

    try {
        const testOutputs = await runTestFilesWithoutResolvingThem(inputFiles);
        // resolve the tests in serial to prevent file system conflicts
        const results = await testOutputs.reduce(
            async (
                lastGroup: Promise<ResolvedTestGroupResults[]>,
                currentOutput: ResolvedTestGroupResults | Promise<ResolvedTestGroupResults>,
            ) => {
                const testGroupOutput = await currentOutput;
                if (testResultCallback) {
                    testResultCallback(testGroupOutput);
                }
                return (await lastGroup).concat(testGroupOutput);
            },
            Promise.resolve([] as ResolvedTestGroupResults[]),
        );

        return results;
    } catch (error) {
        throwInternalTestVirError(`Error running test-vir api: ${error}`);
    } finally {
        alreadyRunning = false;
    }
}
