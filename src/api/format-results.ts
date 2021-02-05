import {FileNotFoundError} from '../errors/file-not-found-error';
import {callerToString} from '../get-caller-file';
import {colors, separator, tab} from '../string-output';
import {ResultState, resultStateExplanations} from '../test-runners/result-state';
import {isTestObject} from '../test-runners/run-individual-test';
import {AcceptedTestInputs, IndividualTestResult} from '../test-runners/run-individual-test-types';
import {ResolvedTestGroupOutput} from '../test-runners/test-group-types';

export function countFailures(testGroupResults: Readonly<ResolvedTestGroupOutput>[]): number {
    return testGroupResults.reduce((count, singleTestGroupResult) => {
        return (
            count +
            singleTestGroupResult.allResults.reduce((innerCount, individualTestResult) => {
                return innerCount + Number(!individualTestResult.success);
            }, 0)
        );
    }, 0);
}

export function getFinalMessage(testGroupResults: Readonly<ResolvedTestGroupOutput>[]) {
    const failures = countFailures(testGroupResults);

    return failures > 0
        ? `${getPassedColor(false)}${failures} Test${failures === 1 ? '' : 's'} Failed${
              colors.reset
          }`
        : '';
}

export function formatAllResults(testGroupResults: Readonly<ResolvedTestGroupOutput>[]): string {
    const formattedOutput = testGroupResults
        .map((testGroup) => formatSingleResult(testGroup))
        .join('\n');
    return `${formattedOutput}\n${getFinalMessage(testGroupResults)}`;
}

function isFileNotFoundError(input: Readonly<ResolvedTestGroupOutput>): boolean {
    return input.allResults.length === 1 && input.allResults[0]?.error instanceof FileNotFoundError;
}

export function formatSingleResult(testGroupResult: Readonly<ResolvedTestGroupOutput>): string {
    const testFilePassed: boolean = countFailures([testGroupResult]) === 0;

    const description = `${getPassedColor(testFilePassed)}${callerToString(testGroupResult.caller, {
        line: !isFileNotFoundError(testGroupResult),
    })} ${testGroupResult.description}${colors.reset}`;

    // no need for any more details if the file wasn't even found
    if (isFileNotFoundError(testGroupResult)) {
        return description;
    }

    const testCount = ` (${testGroupResult.allResults.length} test${
        testGroupResult.allResults.length === 1 ? '' : 's'
    })`;

    const resultDetails =
        testCount +
        testGroupResult.allResults
            .map((individualResult, index) => formatIndividualTestResults(individualResult, index))
            .join('');

    const result = `${getPassedString(testFilePassed)}${resultDetails}`;

    return `${description}${separator} ${result}`;
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
        `${callerToString(individualResult.caller, {
            file: false,
        })}`;

    const stateString = `${getPassedString(individualResult.success)}${separator} ${
        resultStateExplanations[individualResult.resultState]
    }`;

    const failureReason = figureOutFailureReason(individualResult, 2).split('\n').join(`\n${tab}`);
    const inputString = individualResult.input
        ? `\n${tab}${tab}${colors.info}input${colors.reset}${separator}${formatInput(
              individualResult.input,
              3,
          )}`
        : '';

    const failureExplanation = individualResult.success
        ? ''
        : `\n${tab}${tab}${failureReason}${inputString}`;

    const testResultOutput = `\n${tab}${getPassedColor(individualResult.success)}${testDescriptor}${
        colors.reset
    }${separator} ${stateString}${failureExplanation}`;

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
                return `${colors.info}expected${colors.reset}${separator}${expectObjectString}\n${tab}${colors.fail}but got${colors.reset}${separator}${outputObjectString}`;
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
                const outputValueString: string | undefined = result.error
                    ? formatValue(
                          {
                              errorClass: errorClassName,
                              errorMessage: errorMessage,
                          },
                          indent,
                      )
                    : undefined;

                const outputObjectString =
                    outputValueString == undefined
                        ? 'but no error was thrown'
                        : `but got${colors.reset}${separator}${outputValueString}`;

                return `${colors.info}expected thrown error${colors.reset}${separator}${expectObjectString}\n${tab}${colors.fail}${outputObjectString}`;
            } else {
                return 'No error expectation was assigned.';
            }
        case ResultState.Error:
            return `${colors.fail}error${colors.reset}${separator}${formatValue(
                String(result.error),
                indent,
            )}`;
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
    const json: string = typeof input === 'string' ? input : formatJson(input, indent);
    const output = (json.includes('\n') ? `\n${createIndentString(indent)}` : ' ') + json;

    return output;
}

function createIndentString(indent: number): string {
    return Array(indent)
        .fill(0)
        .map(() => `${tab}`)
        .join('');
}
