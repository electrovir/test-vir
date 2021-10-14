import {runTestFiles} from '..';

async function main() {
    const myFiles = ['path-to-my-test-file.js', 'path-to-another-file.js'];

    const results = await runTestFiles(myFiles);
}

main();
