/**
 * This file should not be included in the tests run using this package itself. Meaning, it should
 * not be included in the glob that's passed into "dist/api/api.js" in "npm test" for this package.
 */

import {relative} from 'path';
import {countFailures, runResolvedTestFiles} from '..';
import {formatLineLeader} from '../api/format-results';
import {colors} from '../string-output';

async function main() {
    const testResults = await runResolvedTestFiles(['./**/!(*.type).test.js']);
    if (testResults.length < 3 || countFailures(testResults)) {
        throw new Error(`Failed to test normal files.`);
    }

    const noResults = await runResolvedTestFiles(['./**/empty-file-test.js']);
    if (!noResults.length || !countFailures(noResults)) {
        throw new Error(`empty test files should cause failures`);
    }

    const fileNotFoundResults = await runResolvedTestFiles(['fjdklsajfkldsajfkldasjk']);
    if (!fileNotFoundResults.length || !countFailures(fileNotFoundResults)) {
        throw new Error(`not found files should cause failures`);
    }
}

function getMessage(success: boolean): string {
    return `${formatLineLeader(success, relative(process.cwd(), __filename))}${colors.reset}`;
}

if (require.main === module) {
    main()
        .then(() => {
            console.log(getMessage(true));
            process.exit(0);
        })
        .catch((error) => {
            console.error(error);
            console.error(getMessage(false));
            process.exit(1);
        });
}
