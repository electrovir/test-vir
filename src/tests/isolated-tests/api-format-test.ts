/**
 * This file should not be included in the tests run using this package itself. Meaning, it should
 * not be included in the glob that's passed into "dist/api/api.js" in "npm test" for this package.
 */

import {relative} from 'path';
import {runTestFiles} from '../..';
import {colors} from '../../formatting/colors';
import {formatLineLeader} from '../../formatting/did-test-pass-string';
import {formatAllResults} from '../../formatting/format-all-results';

function printWrongFormat(input: string): void {
    console.error('vvv begin incorrect formatting vvv');
    console.error(input);
    console.error('^^^ end incorrect formatting ^^^');
}

async function main() {
    const failedFunctionInputResultFormatted = formatAllResults(
        await runTestFiles(['./**/failed-function-input-test.js']),
    );
    if (!failedFunctionInputResultFormatted.includes(`error${colors.reset}:`)) {
        printWrongFormat(failedFunctionInputResultFormatted);
        throw new Error(`failedFunctionInputString test did not result in an error`);
    }
    if (failedFunctionInputResultFormatted.includes(`input${colors.reset}: undefined`)) {
        printWrongFormat(failedFunctionInputResultFormatted);
        throw new Error(`failedFunctionInputString has undefined input with a function input`);
    }

    const ignoredTestsResultsFormatted = formatAllResults(
        await runTestFiles(['./**/force-only-input*.js']),
        true,
    );
    const ignoredCount = (ignoredTestsResultsFormatted.match(/ignored\)/g) || []).length;
    if (ignoredCount !== 8) {
        printWrongFormat(ignoredTestsResultsFormatted);
        throw new Error(
            `ignored test groups should be marked as ignored, only saw ${ignoredCount} ignored counts.`,
        );
    }

    const regexExpectErrorOutput = formatAllResults(
        await runTestFiles(['./**/failed-with-regex-expect-error-message.js']),
        true,
    );
    if (!regexExpectErrorOutput.includes('"errorMessage": /test regex/')) {
        printWrongFormat(regexExpectErrorOutput);
        throw new Error(`regex expect error was not formatted correctly`);
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
