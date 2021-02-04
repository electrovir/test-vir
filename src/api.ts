import {existsSync} from 'fs';
import {promise as glob} from 'glob-promise';
import {resolve} from 'path';
import {countFailures, formatResults, getFinalFailureMessage} from './format-results';
import {getGlobalResults} from './global-results';
import {InternalVirTestError} from './internal-vir-test-error';
import {ResultState} from './result-state';
import {TestError} from './test-error';
import {ResolvedTestGroupOutput} from './test-group-types';

export async function runAllTestFiles(
    files: string[],
): Promise<Readonly<ResolvedTestGroupOutput[]>> {
    try {
        const promises: Promise<unknown>[] = [];

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
            promises.push(import(resolve(filePath)));
        });

        await Promise.all(promises);

        const lostFileResults: Readonly<ResolvedTestGroupOutput[]> = lostFiles.map(
            (lostFilePath) => {
                return {
                    allResults: [
                        {
                            error: new TestError('File not found'),
                            input: undefined,
                            output: undefined,
                            resultState: ResultState.Error,
                            success: false,
                        },
                    ],
                    description: lostFilePath,
                    exclude: false,
                    forceOnly: false,
                    fileOrigin: lostFilePath,
                };
            },
        );

        const globalResults = (await getGlobalResults()).concat(lostFileResults);
        return globalResults;
    } catch (error) {
        throw new InternalVirTestError(error.message);
    }
}

async function figureOutWhatFilesToUse(): Promise<string[]> {
    const foundFiles: string[] = [];
    const lostFiles: string[] = [];

    const inputs = process.argv.slice(2);

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
    const files = await figureOutWhatFilesToUse();

    if (!files.length) {
        throw new Error(`No files to test. Usage: test-vir <file-path-1>.js [, ...otherFilePaths]`);
    }
    const results = await runAllTestFiles(files);

    console.log(formatResults(results) + '\n');

    if (countFailures(results) > 0) {
        throw new TestError(getFinalFailureMessage(results));
    }
}

// execute this code when run from the CLI
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            if (error instanceof TestError) {
                console.error(error.message);
            } else {
                console.error(`Failed to run tests`);
                console.error(error);
            }
            process.exit(1);
        });
}
