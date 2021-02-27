/**
 * This file should not be included in the tests run using this package itself. Meaning, it should
 * not be included in the glob that's passed into "dist/api/api.js" in "npm test" for this package.
 */

import {relative} from 'path';
import {runResolvedTestFiles} from '../..';
import {formatAllResults, formatLineLeader} from '../../api/format-results';
import {colors} from '../../string-output';

async function main() {
    const failedFunctionInputResultFormatted = formatAllResults(
        await runResolvedTestFiles(['./**/failed-function-input-test.js']),
    );
    if (!failedFunctionInputResultFormatted.includes(`error${colors.reset}: Error`)) {
        throw new Error(`failedFunctionInputString test did not result in an error`);
    }
    if (failedFunctionInputResultFormatted.includes(`input${colors.reset}: undefined`)) {
        throw new Error(`failedFunctionInputString has undefined input with a function input`);
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
