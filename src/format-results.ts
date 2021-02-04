import * as styles from 'ansi-styles';
import {ResultState, resultStateExplanations} from './result-state';
import {isTestObject} from './run-individual-test';
import {AcceptedTestInputs, IndividualTestResult} from './run-individual-test-types';
import {ResolvedTestGroupOutput} from './test-group-types';

const colors = {
    info: styles.blue.open,
    fail: styles.red.open,
    success: styles.green.open,
    reset: styles.reset.close,
    bold: styles.bold.open,
};

const tab = '    ';

const separator = `${colors.reset}:`;

export function countFailures(runTestsResults: Readonly<ResolvedTestGroupOutput[]>): number {
    return runTestsResults.reduce((count, singleRunTestsOutput) => {
        return (
            count +
            singleRunTestsOutput.allResults.reduce((innerCount, individualTestResult) => {
                return innerCount + Number(individualTestResult.success);
            }, 0)
        );
    }, 0);
}

export function getFinalFailureMessage(runTestsResults: Readonly<ResolvedTestGroupOutput[]>) {
    const failures = countFailures(runTestsResults);

    return `${getPassedColor(false)}${failures} Test${failures === 1 ? '' : 's'} Failed${
        colors.reset
    }`;
}

export function formatResults(runTestsResults: Readonly<ResolvedTestGroupOutput[]>): string {
    const formattedOutput = runTestsResults
        .map((fileResults) => {
            const testFilePassed = fileResults.allResults.every(
                (individualResult) => individualResult.success,
            );

            const resultsOutput = fileResults.allResults
                .map((individualResult, index) =>
                    formatIndividualTestResults(individualResult, index),
                )
                .join('');

            const results = `${getPassedString(testFilePassed)}${
                testFilePassed ? ` (${fileResults.allResults.length} tests)` : resultsOutput
            }`;

            const output = `${getPassedColor(testFilePassed)}${fileResults.fileOrigin}${
                colors.reset
            }${separator} ${fileResults.description}${separator} ${results}`;
            return output;
        })
        .join('\n');
    return formattedOutput;
}

function getPassedString(passed: boolean): string {
    return `${getPassedColor(passed)}${passed ? `Passed` : `Failed`}${colors.reset}`;
}
function getPassedColor(passed: boolean): string {
    return `${colors.bold}${passed ? colors.success : colors.fail}`;
}

function formatIndividualTestResults(
    individualResult: IndividualTestResult<unknown, unknown>,
    index: number,
): string {
    const testDescriptor: string =
        (individualResult.input &&
            isTestObject(individualResult.input) &&
            individualResult.input.description) ||
        `Test ${index}`;

    const stateString = `${getPassedString(individualResult.success)}${separator} ${
        resultStateExplanations[individualResult.resultState]
    }`;

    const failureReason = figureOutFailureReason(individualResult, 2).split('\n').join(`\n${tab}`);
    const failureExplanation = individualResult.success
        ? ''
        : `\n${tab}${tab}${failureReason}\n${tab}${tab}${colors.info}input${
              colors.reset
          }${separator}${formatInput(individualResult.input, 3)}`;

    const testResultOutput = `\n${tab}${getPassedColor(
        individualResult.success,
    )}${testDescriptor}${separator} ${stateString}${failureExplanation}`;

    return testResultOutput;
}

function figureOutFailureReason(
    result: IndividualTestResult<unknown, unknown>,
    indent: number,
): string {
    switch (result.resultState) {
        case ResultState.NoCheckPass:
        case ResultState.ExpectMatchPass:
        case ResultState.ErrorMatchPass:
            return 'Not a failure.';
        case ResultState.ExpectMatchFail:
            if (result.input && isTestObject(result.input)) {
                const expectObjectString = formatValue(result.input.expect, indent);
                const outputObjectString = formatValue(result.output, indent);
                return `${colors.info}expected${colors.reset}${separator}${expectObjectString}\n${tab}${colors.info}but got${colors.reset}${separator}${outputObjectString}`;
            } else {
                return 'No expectation was assigned.';
            }
        case ResultState.ErrorMatchFail:
            if (result.input && isTestObject(result.input)) {
                const expectObjectString =
                    ('expectError' in result.input &&
                        (result.input.expectError && 'errorClass' in result.input.expectError
                            ? replaceErrorClassString(
                                  formatValue(
                                      {
                                          ...result.input.expectError,
                                          errorClass: result.input.expectError.errorClass.name,
                                      },
                                      indent,
                                  ),
                                  result.input.expectError.errorClass.name,
                              )
                            : formatValue(result.input.expectError, indent))) ||
                    undefined;

                const errorClassName: string | undefined = (() => {
                    try {
                        return (result.error as any).constructor.name;
                    } catch (error) {
                        return undefined;
                    }
                })();
                const errorMessage: string | undefined = (() => {
                    try {
                        return (result.error as any).message;
                    } catch (error) {
                        return undefined;
                    }
                })();
                const outputObjectString = formatValue(
                    (result.error && {
                        errorClass: errorClassName,
                        errorMessage: errorMessage,
                    }) ||
                        undefined,
                    indent,
                );

                return `${colors.info}error expected${colors.reset}${separator}${expectObjectString}\n${tab}${colors.info}but got${colors.reset}${separator}${outputObjectString}`;
            } else {
                return 'No error expectation was assigned.';
            }
        case ResultState.Error:
            return String(result.error);
    }
}

/**
 * Remove the quotes around the error class name so it can be seen that it looks like a class name
 * instead of a string
 */
function replaceErrorClassString(input: string, className: string): string {
    return input.replace(`"errorClass": "${className}"`, `"errorClass": ${className}`);
}

function formatInput(
    input: AcceptedTestInputs<unknown, unknown> | undefined,
    indent: number,
): string {
    if (input && 'expectError' in input && input.expectError && 'errorClass' in input.expectError) {
        return replaceErrorClassString(
            formatValue(
                {
                    ...input,
                    expectError: {
                        ...input.expectError,
                        // this class constructor property gets stripped out in the JSON formatting so
                        // here we'll convert it to a string so it can get printed
                        errorClass: input.expectError.errorClass.name,
                    },
                },
                indent,
            ),
            input.expectError.errorClass.name,
        );
    } else {
        return formatValue(input, indent);
    }
}

function formatJson(input: any, indent: number): string {
    const json = JSON.stringify(input, null, `${tab}`);

    // this String cast handles the case where input is undefined, which results in JSON.stringify
    // outputting undefined instead of the string "undefined"
    return (typeof json === 'string' ? json : String(json))
        .split('\n')
        .join(`\n${createIndentString(indent)}`);
}

function formatValue(input: any, indent: number): string {
    const json = formatJson(input, indent);
    const output = (json.includes('\n') ? `\n${createIndentString(indent)}` : ' ') + json;

    return output;
}

function createIndentString(indent: number): string {
    return Array(indent)
        .fill(0)
        .map(() => `${tab}`)
        .join('');
}
