#!/usr/bin/env node
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

export const recursiveRunAllTestFilesErrorMessage = `runAllTestFiles cannot be running inside of itself!`;

export async function runTestFiles(inputFiles: string[]): Promise<ResolvedTestGroupResults[]> {
    // prevent this function from running inside of itself as this will mess up the results
    if (alreadyRunning) {
        throw new TestError(recursiveRunAllTestFilesErrorMessage);
    } else {
        alreadyRunning = true;
    }

    try {
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

        const resultPromises = await runTestGroups(testGroups, {
            found: foundFiles.filter((file) => !failedImportFiles.includes(file)),
            lost: lostFiles,
        });

        const failedImportResults = generatedFailedImportResults(importFailures);
        const emptyFileResults = getUnusedFileErrorResults(emptyFiles);

        return resultPromises.concat(failedImportResults, emptyFileResults);
    } catch (error) {
        throwInternalTestVirError(`Error running test-vir api: ${error}`);
    } finally {
        alreadyRunning = false;
    }
}
