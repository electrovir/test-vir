/**
 * This file should not be included in the tests run using this package itself. Meaning, it should
 * not be included in the glob that's passed into "dist/api/api.js" in "npm test" for this package.
 */

import {relative} from 'path';
import {countFailures, runTestFiles} from '..';
import {colors} from '../formatting/colors';
import {formatLineLeader} from '../formatting/did-test-pass-string';
import {ResultState} from '../testing/result-state';

async function main() {
    const testResults = await runTestFiles(['./**/!(*.type).test.js']);
    if (testResults.length < 3 || countFailures(testResults)) {
        throw new Error(`Failed to test normal files.`);
    }

    const noTestGroupResults = await runTestFiles(['./**/empty-test-group-input.js']);
    if (
        noTestGroupResults.length < 1 ||
        countFailures(testResults) ||
        noTestGroupResults[0]?.description !== 'Test group contained no tests'
    ) {
        throw new Error(`Failed to fail when a test group was empty.`);
    }
    if (noTestGroupResults[1]?.description !== 'Test group contained no tests') {
        throw new Error(`Failed to fail when an async test group was empty.`);
    }
    if (
        noTestGroupResults[1]?.fileSource !==
        './dist/isolated-test-files/input-files/empty-test-group-input.js'
    ) {
        throw new Error(
            `fileSource property was not properly included. Got ${noTestGroupResults[1]?.fileSource}`,
        );
    }

    const noResults = await runTestFiles(['./**/empty-file-input.js']);
    if (!noResults.length || !countFailures(noResults)) {
        throw new Error(`empty test files should cause failures`);
    }

    const fileNotFoundResults = await runTestFiles(['this-file-does-not-exist']);
    if (!fileNotFoundResults.length || !countFailures(fileNotFoundResults)) {
        throw new Error(`not found files should cause failures`);
    }

    const forcedTestGroupResults = await runTestFiles(['./**/force-only-input*.js']);
    if (forcedTestGroupResults.length !== 8) {
        throw new Error(
            `forced tests did not read both files, only got ${forcedTestGroupResults.length} testGroups`,
        );
    }
    const notIgnoredTestGroups = forcedTestGroupResults.filter(
        (result) => result.ignoredReason === undefined,
    );
    if (notIgnoredTestGroups.length !== 1) {
        throw new Error(`forced tests should ignore all other testGroups`);
    }
    const notIgnoredRunTests = notIgnoredTestGroups[0]!.allResults.filter(
        (result) => result.resultState !== ResultState.Ignored,
    );
    if (notIgnoredRunTests.length !== 1) {
        throw new Error(`forced tests should ignore all other runTest calls`);
    }
    if (!notIgnoredRunTests[0]!.success) {
        throw new Error(`forced test should have passed`);
    }

    const invalidImportResults = await runTestFiles(['./**/invalid-import-input.js']);
    if (invalidImportResults.length !== 1) {
        throw new Error(
            `invalid-import-input did not generate a single test group, it generated ${invalidImportResults.length}`,
        );
    }
    if (invalidImportResults[0]!.allResults.length !== 1) {
        throw new Error("invalid-import-input's test group generated more than one result");
    }
    if (
        !(invalidImportResults[0]!.allResults[0]!.error instanceof Error) ||
        !invalidImportResults[0]!.allResults[0]!.error.message.toLowerCase().includes(
            'cannot find module',
        )
    ) {
        throw new Error('invalid-import-inputs did not fail as it should have');
    }

    const invalidErrorResults = await runTestFiles(['./**/error-class-and-message-input.js']);
    if (invalidErrorResults.length !== 1) {
        throw new Error(
            `invalid-import-input did not generate a single test group, it generated ${invalidErrorResults.length}`,
        );
    }
    if (invalidErrorResults[0]!.allResults[0]!.success) {
        throw new Error(`Test with message and class expectation did not properly fail`);
    }

    const expectErrorWithNoErrorThrown = await runTestFiles([
        './**/failed-with-regex-expect-error-message.js',
    ]);
    if (expectErrorWithNoErrorThrown.length !== 1) {
        throw new Error(
            `failed-with-regex-expect-error-message did not generate a single test group, it generated ${expectErrorWithNoErrorThrown.length}`,
        );
    }
    if (expectErrorWithNoErrorThrown[0]!.allResults[0]!.success) {
        throw new Error(`Test with message and class expectation did not properly fail`);
    }

    const indirectTestResults = await runTestFiles(['./**/indirect-test-usage.js']);
    const indirectFailures = indirectTestResults.reduce((allFailures: boolean[], outerResult) => {
        return allFailures.concat(
            ...outerResult.allResults
                .map((innerResult) => innerResult.success)
                .filter((success) => {
                    return !success;
                }),
        );
    }, []);
    if (indirectFailures.length) {
        console.log(indirectTestResults[0]!.allResults);
        throw new Error(`Indirect test failed`);
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
