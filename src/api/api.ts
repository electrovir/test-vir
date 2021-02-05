import {existsSync} from 'fs';
import {promise as glob} from 'glob-promise';
import {resolve} from 'path';
import {FileNotFoundError} from '../errors/file-not-found-error';
import {throwInternalVirTestError} from '../errors/internal-vir-test-error';
import {TestError} from '../errors/test-error';
import {emptyCaller} from '../get-caller-file';
import {ResultState} from '../test-runners/result-state';
import {ResolvedTestGroupOutput} from '../test-runners/test-group-types';
import {formatSingleResult, getFinalMessage} from './format-results';
import {getAllGlobalResults} from './global-results';

export async function runAllTestFiles(
    inputFiles: string[],
): Promise<Promise<Readonly<ResolvedTestGroupOutput>>[]> {
    try {
        const files = await figureOutWhatFilesToUse(inputFiles);

        const importPromises: Promise<unknown>[] = [];

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

        foundFiles.map((filePath) => {
            importPromises.push(import(resolve(filePath)));
        });

        // await all the imports
        await Promise.all(importPromises);

        // wrapped in promises so they're compatible with the return type
        const lostFileResults: Promise<Readonly<ResolvedTestGroupOutput>>[] = lostFiles.map(
            async (lostFilePath) => {
                const errorResult: Readonly<ResolvedTestGroupOutput> = {
                    allResults: [
                        {
                            error: new FileNotFoundError(`File not found: ${lostFilePath}`),
                            input: undefined,
                            output: undefined,
                            resultState: ResultState.Error,
                            success: false,
                            caller: emptyCaller,
                        },
                    ],
                    description: 'File not found',
                    exclude: false,
                    forceOnly: false,
                    caller: {filePath: lostFilePath, lineNumber: -1, columnNumber: -1},
                };
                return errorResult;
            },
        );

        return getAllGlobalResults().concat(lostFileResults);
    } catch (error) {
        throwInternalVirTestError(error);
    }
}

async function figureOutWhatFilesToUse(inputs: string[]): Promise<string[]> {
    const foundFiles: string[] = [];
    const lostFiles: string[] = [];

    await Promise.all(
        inputs.map(async (input) => {
            if (existsSync(input)) {
                foundFiles.push(input);
            } else {
                // try glob expansion
                const globFoundFiles: string[] = await glob(input);
                if (globFoundFiles.length > 0) {
                    foundFiles.push(...globFoundFiles);
                } else {
                    // we really couldn't find anything
                    lostFiles.push(input);
                }
            }
        }),
    );

    // combine all files, later in the pipeline we'll handle missing ones
    return foundFiles.concat(lostFiles);
}

async function main(): Promise<void> {
    const inputs = process.argv.slice(2);
    if (!inputs.length) {
        throw new TestError(
            `No files to test. Usage: test-vir <file-path-1>.js [, ...otherFilePaths].\n` +
                `Globs are also supported.`,
        );
    }
    const promisedResults = await runAllTestFiles(inputs);

    // await each promise individually so results can print as the tests finish
    promisedResults.forEach(async (resultPromise) => {
        console.log(formatSingleResult(await resultPromise));
    });

    // await all promises so we make sure they're all done before continuing
    const resolvedResults = await Promise.all(promisedResults);

    const failureMessage = getFinalMessage(resolvedResults);

    if (failureMessage) {
        throw new TestError(failureMessage);
    }
}

// this code is executed when run from the CLI
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            if (error instanceof TestError) {
                if (error.message) {
                    console.error(error.message);
                }
            } else {
                console.error(`Failed to run tests`);
                console.error(error);
            }
            process.exit(1);
        });
}
