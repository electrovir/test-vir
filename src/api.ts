import {resolve} from 'path';
import {getGlobalResults} from './global-results';
import {InternalVirTestError} from './internal-vir-test-error';
import {ResolvedRunTestsOutput} from './run-all-tests-types';
import {TestError} from './test-error';

export async function runAllTestFiles(
    files: string[],
): Promise<Readonly<ResolvedRunTestsOutput[]>> {
    try {
        const promises: Promise<unknown>[] = [];

        files.map((filePath) => {
            promises.push(import(resolve(filePath)));
        });

        await Promise.all(promises);

        const globalResults = await getGlobalResults();
        return globalResults;
    } catch (error) {
        throw new InternalVirTestError(error.message);
    }
}

export function formatTestResults(runTestsResults: Readonly<ResolvedRunTestsOutput[]>): string {
    return '';
}

export function didAllTestsPass(runTestsResults: Readonly<ResolvedRunTestsOutput[]>): boolean {
    return runTestsResults.every((singleRunTestsOutput) =>
        singleRunTestsOutput.allResults.every(
            (individualTestResult) => individualTestResult.success,
        ),
    );
}

async function main(): Promise<void> {
    const files = process.argv.slice(2);

    console.log(JSON.stringify(files, null, 4));

    if (!files.length) {
        throw new Error(`No files to test. Usage: test-vir <file-path-1>.js [, ...otherFilePaths]`);
    }
    const results = await runAllTestFiles(files);

    console.log(formatTestResults(results));

    if (!didAllTestsPass(results)) {
        throw new TestError('Test(s) Failed');
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
