import {callerToString} from '../caller/caller-to-string';
import {EmptyTestGroupError} from '../errors/empty-test-group.error';
import {FileNotFoundError} from '../errors/file-not-found.error';
import {FileNotUsedError} from '../errors/file-not-used.error';
import {separator} from '../strings/string-format';
import {ResultState} from '../testing/result-state';
import {ResolvedTestGroupResults} from '../testing/test-group/test-group-output';
import {colors} from './colors';
import {countFailures} from './count-failures';
import {formatLineLeader} from './did-test-pass-string';
import {formatIndividualTestResult} from './format-individual-test-result';
import {formatDebugOutput} from './format-output';

function isErrorResult(input: Readonly<ResolvedTestGroupResults>, errorClass: new () => Error) {
    return input.allResults.length === 1 && input.allResults[0]?.error instanceof errorClass;
}

export function formatSingleTestGroupResult(
    testGroupResult: Readonly<ResolvedTestGroupResults>,
    debug = false,
): string {
    const testFilePassed: boolean = countFailures([testGroupResult]) === 0;
    const ignoredTestCount: number =
        testGroupResult.ignoredReason == undefined
            ? testGroupResult.allResults.reduce((accum, result) => {
                  if (result.resultState === ResultState.Ignored) {
                      return accum + 1;
                  }
                  return accum;
              }, 0)
            : testGroupResult.tests.length;

    const isEmptyDescription = !testGroupResult.description;
    const filePath = callerToString(testGroupResult.caller, {
        line: !isErrorResult(testGroupResult, FileNotFoundError),
    });

    const status = formatLineLeader(
        testFilePassed,
        isEmptyDescription ? filePath : testGroupResult.description,
        ignoredTestCount > 0,
    );

    // no need for any more details if these errors occurred
    if (
        isErrorResult(testGroupResult, FileNotFoundError) ||
        isErrorResult(testGroupResult, FileNotUsedError) ||
        isErrorResult(testGroupResult, EmptyTestGroupError)
    ) {
        // if these errors are encountered, the test description is set to the error message already
        // so we can just log the description
        return `${status}${separator} ${filePath}${colors.reset}\n`;
    }

    const ignoredTestString = ignoredTestCount ? `, ${ignoredTestCount} ignored` : '';
    const testCount = testGroupResult.tests.length;

    const testCountString = ` ${colors.reset}${
        ignoredTestCount ? colors.warn : ''
    }(${testCount} test${testCount === 1 ? '' : 's'}${ignoredTestString})`;

    const debugDetails = debug ? formatDebugOutput(testGroupResult, 1) : '';
    const resultDetails =
        testFilePassed && !debug
            ? ''
            : testGroupResult.allResults
                  .map((individualResult) => formatIndividualTestResult(individualResult, debug))
                  .join('');

    const result = `${testCountString}${colors.info} ${isEmptyDescription ? '' : filePath}${
        colors.reset
    }${debugDetails}${resultDetails}`;

    const whiteSpace = testFilePassed ? '' : '\n';

    return `${whiteSpace}${status}${result}${whiteSpace}`;
}
