import {runTestFiles} from '..';

async function main() {
    const myFiles = ['path-to-my-test-file.js', './**/*.test.js'];

    const promisedResults = await runTestFiles(myFiles);
    promisedResults.forEach(async (promisedResult) => {
        // print test success as each test finishes
        await Promise.all(
            promisedResult.allResults.map(async (individualResult) => {
                console.info(individualResult.success);
            }),
        );
    });

    // make sure to await all results before doing anything else to make sure the tests are all finished
    await Promise.all(promisedResults);
}

main();
