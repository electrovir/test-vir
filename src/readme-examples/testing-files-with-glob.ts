import {runTestFiles} from '..';

async function main() {
    const myFiles = ['path-to-my-test-file.js', './**/*.test.js'];

    const results = await runTestFiles(myFiles);
}

main();
