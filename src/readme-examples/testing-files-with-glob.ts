// testing-files-with-glob.ts
import {runResolvedTestFiles} from '..';

async function main() {
    const myFiles = ['path-to-my-test-file.js', './**/*.test.js'];

    const results = await runResolvedTestFiles(myFiles);
}

main();
