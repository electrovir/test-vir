#!/usr/bin/env node
import {existsSync} from 'fs';
import {promise as glob} from 'glob-promise';
import {resolve} from 'path';
import {FileNotUsedError} from '../errors/file-not-used-error';
import {ImportError} from '../errors/import-error';
import {throwInternalTestVirError} from '../errors/internal-test-vir-error';
import {TestError} from '../errors/test-error';
import {Caller, emptyCaller} from '../get-caller-file';
import {colors} from '../string-output';
import {ResultState} from '../testing/result-state';
import {clearGlobalTests, getAndClearGlobalTests} from '../testing/test-group/global-test-groups';
import {runTestGroups} from '../testing/test-group/test-group-runner';
import {ResolvedTestGroupResults, TestGroupOutput} from '../testing/test-group/test-group-types';
import {formatSingleResult, getFinalMessage, getPassedColor} from './format-results';

let alreadyRunning = false;

let debugMode = false;

export const recursiveRunAllTestFilesErrorMessage = `runAllTestFiles cannot be running inside of itself!`;

export async function runResolvedTestFiles(
    inputFiles: string[],
): Promise<Readonly<ResolvedTestGroupResults>[]> {
    return await runAllTestFiles(inputFiles);
}

export async function runAllTestFiles(inputFiles: string[]): Promise<ResolvedTestGroupResults[]> {
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

async function handleImports(
    filePaths: string[],
): Promise<{importFailures: ImportError[]; emptyFiles: string[]; testGroups: TestGroupOutput[]}> {
    const emptyFiles: string[] = [];
    const testGroups: TestGroupOutput[] = [];
    // await all the imports
    const importFailures: ImportError[] = await filePaths.reduce(
        async (lastPromise: Promise<ImportError[]>, currentFilePath): Promise<ImportError[]> => {
            const failures = await lastPromise;
            try {
                await import(resolve(currentFilePath));
                const newTestGroups = await getAndClearGlobalTests();
                if (!newTestGroups.length) {
                    emptyFiles.push(currentFilePath);
                }
                testGroups.push(
                    ...newTestGroups.map((testGroup) => {
                        return {
                            ...testGroup,
                            fileSource: currentFilePath,
                        };
                    }),
                );
            } catch (error) {
                failures.push(new ImportError(error, currentFilePath));
            }
            return failures;
        },
        Promise.resolve([]),
    );
    return {
        importFailures,
        emptyFiles,
        testGroups,
    };
}

function getUnusedFileErrorResults(unusedFiles: string[]): ResolvedTestGroupResults[] {
    return unusedFiles.map((unusedFilePath): ResolvedTestGroupResults => {
        const unusedFileCaller = {...emptyCaller, filePath: unusedFilePath};
        const result: ResolvedTestGroupResults = {
            allResults: [
                {
                    caller: unusedFileCaller,
                    error: new FileNotUsedError(`File contained no tests: ${unusedFilePath}`),
                    input: undefined,
                    output: undefined,
                    resultState: ResultState.Error,
                    success: false,
                },
            ],
            caller: unusedFileCaller,
            description: unusedFilePath,
            exclude: false,
            forceOnly: false,
            ignoredReason: undefined,
            tests: [],
            fileSource: unusedFilePath,
        };

        return result;
    });
}

function generatedFailedImportResults(failures: ImportError[]): ResolvedTestGroupResults[] {
    return failures.map((failure): ResolvedTestGroupResults => {
        const errorCaller: Caller = {...emptyCaller, filePath: failure.filePath};
        const result: ResolvedTestGroupResults = {
            allResults: [
                {
                    caller: errorCaller,
                    error: failure.error,
                    input: undefined,
                    output: undefined,
                    resultState: ResultState.Error,
                    success: false,
                },
            ],
            caller: errorCaller,
            description: failure.filePath,
            exclude: false,
            forceOnly: false,
            ignoredReason: undefined,
            tests: [],
            fileSource: failure.filePath,
        };

        return result;
    });
}

/**
 * Treats all input strings as file names. If one of the strings cannot be matched to a valid file,
 * it is executed as a glob and the found files there are included in the output. If still no files
 * are found, the original string is simply included in the output.
 *
 * Thus, the output of this function can include missing files which should still be handled
 * downstream. The output will not contain duplicates.
 */
export async function expandGlobs(inputs: string[]): Promise<string[]> {
    const foundFiles = new Set<string>();
    const lostFiles = new Set<string>();

    await Promise.all(
        inputs.map(async (input) => {
            if (existsSync(input)) {
                foundFiles.add(input);
            } else {
                // try glob expansion
                const globFoundFiles: string[] = await glob(input);
                if (globFoundFiles.length > 0) {
                    globFoundFiles.forEach((file) => foundFiles.add(file));
                } else {
                    // we really couldn't find anything
                    lostFiles.add(input);
                }
            }
        }),
    );

    // combine all files, later in the pipeline we'll handle missing ones
    return Array.from(foundFiles).concat(Array.from(lostFiles));
}

const supportedFlags = ['--debug'];

function setFlags(flags: string[]) {
    if (flags.includes('--debug')) {
        debugMode = true;
    }

    const unsupportedFlags = flags.filter((flag) => !supportedFlags.includes(flag));

    if (unsupportedFlags.length) {
        throw new Error(`unsupported flags: ${unsupportedFlags.join(', ')}`);
    }
}

async function main(): Promise<void> {
    const {inputs, flags} = process.argv.slice(2).reduce(
        (accum, currentString) => {
            if (currentString.startsWith('--')) {
                accum.flags.push(currentString);
            } else {
                accum.inputs.push(currentString);
            }
            return accum;
        },
        {inputs: [] as string[], flags: [] as string[]},
    );

    if (flags.length) {
        setFlags(flags);
    }

    if (!inputs.length) {
        throw new TestError(
            `No files to test. Usage: test-vir <file-path-1>.js [, ...otherFilePaths].\n` +
                `Globs are also supported.`,
        );
    }
    const results: ResolvedTestGroupResults[] = await runAllTestFiles(inputs);

    // await each promise individually so results can print as the tests finish
    results.forEach(async (result) => {
        console.info(formatSingleResult(result, debugMode));
    });

    const failureMessage = getFinalMessage(results);

    if (failureMessage) {
        throw new TestError(failureMessage);
    }
}

// this code is executed when run from the CLI
if (require.main === module) {
    main()
        .then(() => {
            console.info(`${getPassedColor(true)}All tests passed.${colors.reset}`);
            process.exit(0);
        })
        .catch((error) => {
            if (error instanceof TestError) {
                // this message will include coloring
                console.error(error.message);
            } else {
                console.error(`${getPassedColor(false)}Failed to run tests.${colors.reset}`);
                console.error(error);
            }
            process.exit(1);
        });
}
