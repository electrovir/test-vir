import {promise as glob} from 'glob-promise';
import {resolve} from 'path';
import {InternalVirTestError} from './internal-vir-test-error';
import {getGlobalResults} from './run-tests';

async function runApi(pattern: string): Promise<void> {
    try {
        const files = await glob(pattern);
        console.log('all files:', files);
        const promises: Promise<unknown>[] = [];

        files.map((filePath) => {
            promises.push(import(resolve(filePath)));
        });
        try {
            await Promise.all(promises);
        } catch (error) {
            // if (!(error instanceof TestError)) {
            //     throw error;
            // }
        }

        console.log('global results');
        const globalResults = await getGlobalResults();
        console.log(globalResults);
    } catch (error) {
        throw new InternalVirTestError(error.message);
    }
}

async function main(): Promise<void> {
    const pattern = process.argv[2] || './**/*.test.js';

    return runApi(pattern);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('error encountered');
        console.error(error);
        process.exit(1);
    });
