import {EmptyTestGroupError} from '../errors/empty-test-group-error';
import {FileNotFoundError} from '../errors/file-not-found-error';
import {FileNotUsedError} from '../errors/file-not-used-error';
import {callerToString} from '../get-caller-file';
import {colors, createIndentString, separator} from '../string-output';
import {ResultState, resultStateExplanations} from '../test-runners/result-state';
import {isTestObject} from '../test-runners/run-individual-test';
import {AcceptedTestInputs, IndividualTestResult} from '../test-runners/run-individual-test-types';
import {ResolvedTestGroupResults} from '../test-runners/test-group-types';

export function countFailures(testGroupResults: Readonly<ResolvedTestGroupResults>[]): number {
    return testGroupResults.reduce((count, singleTestGroupResult) => {
        return (
            count +
            singleTestGroupResult.allResults.reduce((innerCount, individualTestResult) => {
                return innerCount + Number(!individualTestResult.success);
            }, 0)
        );
    }, 0);
}

export function getFinalMessage(testGroupResults: Readonly<ResolvedTestGroupResults>[]) {
    const failures = countFailures(testGroupResults);

    return failures > 0
        ? `${getPassedColor(false)}${failures} test${failures === 1 ? '' : 's'} failed${
              colors.reset
          }`
        : '';
}

export function formatAllResults(
    testGroupResults: Readonly<ResolvedTestGroupResults>[],
    debug = false,
): string {
    const formattedOutput = testGroupResults
        .map((testGroup) => formatSingleResult(testGroup, debug))
        .join('\n');
    return `${formattedOutput}\n${getFinalMessage(testGroupResults)}`;
}

function isErrorResult(input: Readonly<ResolvedTestGroupResults>, errorClass: new () => Error) {
    return input.allResults.length === 1 && input.allResults[0]?.error instanceof errorClass;
}

export function formatSingleResult(
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
                  .map((individualResult) => formatIndividualTestResults(individualResult, debug))
                  .join('');

    const result = `${testCountString}${colors.info} ${isEmptyDescription ? '' : filePath}${
        colors.reset
    }${debugDetails}${resultDetails}`;

    const whiteSpace = testFilePassed ? '' : '\n';

    return `${whiteSpace}${status}${result}${whiteSpace}`;
}

function getPassedString(passed: boolean, containsWarning = false): string {
    return `${getPassedColor(passed, containsWarning)}${passed ? `Passed` : `Failed`}`;
}

export function getPassedColor(passed: boolean, containsWarning = false): string {
    const passedColor = containsWarning ? colors.warn : colors.success;

    return `${colors.bold}${passed ? passedColor : colors.fail}`;
}

export function formatLineLeader(
    success: boolean,
    description: string,
    containsWarning = false,
): string {
    return `${getPassedString(success, containsWarning)}${separator} ${description}`;
}

export function formatIndividualTestResults(
    individualResult: IndividualTestResult<any, unknown>,
    debug = false,
): string {
    const testDescriptor: string =
        (individualResult.input &&
            isTestObject(individualResult.input) &&
            individualResult.input.description) ||
        `${callerToString(individualResult.caller, {
            file: false,
        })}`;

    const description = `${formatLineLeader(
        individualResult.success,
        testDescriptor,
        individualResult.resultState === ResultState.Ignored,
    )}${colors.reset}${separator} ${resultStateExplanations[individualResult.resultState]}`;

    const failureReason = figureOutFailureReason(individualResult, 2)
        .split('\n')
        .join(`\n${createIndentString(1)}`);
    const inputString = individualResult.input
        ? `\n${createIndentString(2)}${colors.info}input${colors.reset}${separator}${formatInput(
              individualResult.input,
              3,
          )}`
        : '';

    const failureExplanation = individualResult.success
        ? ''
        : `\n${createIndentString(2)}${failureReason}${inputString}`;

    const debugOutput = debug ? formatDebugOutput(individualResult, 2) : '';
    const testResultOutput = `\n${createIndentString(
        1,
    )}${description}${failureExplanation}${debugOutput}`;

    return testResultOutput;
}

function figureOutFailureReason(
    result: IndividualTestResult<unknown, unknown>,
    indent: number,
): string {
    switch (result.resultState) {
        case ResultState.Ignored:
        case ResultState.NoCheckPass:
        case ResultState.ExpectMatchPass:
        case ResultState.ErrorMatchPass:
            return 'Not a failure.';
        case ResultState.ExpectMatchFail:
            if (result.input && isTestObject(result.input)) {
                const expectObjectString = formatValue(result.input.expect, indent);
                const outputObjectString = formatValue(result.output, indent);
                return `${colors.info}expected${
                    colors.reset
                }${separator}${expectObjectString}\n${createIndentString(1)}${colors.fail}but got${
                    colors.reset
                }${separator}${outputObjectString}`;
            } else {
                return 'No expectation was assigned.';
            }
        case ResultState.ErrorMatchFail:
            if (result.input && isTestObject(result.input)) {
                const serializedErrorMessageExpect =
                    'expectError' in result.input && result.input.expectError
                        ? ({
                              ...result.input.expectError,
                              ...('errorClass' in result.input.expectError
                                  ? {
                                        errorClass: result.input.expectError.errorClass.name,
                                    }
                                  : {errorClass: undefined}),
                              ...('errorMessage' in result.input.expectError
                                  ? {
                                        errorMessage: String(result.input.expectError.errorMessage),
                                    }
                                  : {errorMessage: undefined}),
                              // this cast is valid because we're constructing this object from
                              // another of the same type so if it was originally the correct type,
                              // it still is!
                          } as const)
                        : undefined;

                const expectObjectString = serializedErrorMessageExpect
                    ? replaceErrorClassString(
                          formatValue(serializedErrorMessageExpect, indent),
                          serializedErrorMessageExpect.errorClass,
                      )
                    : undefined;

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

                return `${colors.info}expected thrown error${
                    colors.reset
                }${separator}${expectObjectString}\n${createIndentString(1)}${
                    colors.fail
                }${outputObjectString}`;
            } else {
                return 'No error expectation was assigned.';
            }
        case ResultState.Error:
            const error = result.error;
            return `${colors.fail}error${colors.reset}${separator}${formatValue(
                error instanceof Error && error.stack ? error.stack : String(error),
                indent,
            )}`;
    }
}

/**
 * Remove the quotes around the error class name so it can be seen that it looks like a class name
 * instead of a string
 */
function replaceErrorClassString(input: string, className?: string): string {
    if (className) {
        return input.replace(`"errorClass": "${className}"`, `"errorClass": ${className}`);
    } else {
        return input;
    }
}

/**
 * Remove the quotes around the error class name so it can be seen that it looks like a class name
 * instead of a string
 */
function replaceConstructorStrings(input: string): string {
    return input.replace(`"Function"`, `Function`).replace(/ "(\/.*\/)"/g, ' $1');
}

function formatInput(
    rawInput: AcceptedTestInputs<unknown, unknown> | undefined,
    indent: number,
): string {
    if (typeof rawInput === 'function') {
        return ' Function';
    }

    // include the test property as "Function" because a function can't be serialized into JSON
    const inputWithFormattedTestFunction =
        rawInput && 'test' in rawInput ? {...rawInput, test: 'Function'} : rawInput;

    // format error message if it's a regex
    const inputToPrint =
        inputWithFormattedTestFunction &&
        'expectError' in inputWithFormattedTestFunction &&
        inputWithFormattedTestFunction.expectError &&
        'errorMessage' in inputWithFormattedTestFunction.expectError &&
        inputWithFormattedTestFunction.expectError.errorMessage instanceof RegExp
            ? {
                  ...inputWithFormattedTestFunction,
                  expectError: {
                      ...inputWithFormattedTestFunction.expectError,
                      errorMessage: String(inputWithFormattedTestFunction.expectError.errorMessage),
                  },
              }
            : inputWithFormattedTestFunction;

    if (
        inputToPrint &&
        'expectError' in inputToPrint &&
        inputToPrint.expectError &&
        'errorClass' in inputToPrint.expectError
    ) {
        return replaceConstructorStrings(
            replaceErrorClassString(
                formatValue(
                    {
                        ...inputToPrint,
                        expectError: {
                            ...inputToPrint.expectError,
                            // this class constructor property gets stripped out in the JSON formatting so
                            // here we'll convert it to a string so it can get printed
                            errorClass: inputToPrint.expectError.errorClass.name,
                        },
                    },
                    indent,
                ),
                inputToPrint.expectError.errorClass.name,
            ),
        );
    } else {
        return replaceConstructorStrings(formatValue(inputToPrint, indent));
    }
}

function formatJson(input: any, indent: number): string {
    const json = JSON.stringify(input, null, createIndentString(1));

    // this String cast handles the case where input is undefined, which results in JSON.stringify
    // outputting undefined instead of the string "undefined"
    return indentNewLines(typeof json === 'string' ? json : String(json), indent);
}

function formatDebugOutput(
    value: Readonly<ResolvedTestGroupResults> | IndividualTestResult<any, unknown>,
    indent: number,
): string {
    const replaceString = 'REPLACE ME HERE PLEASE WITH THE PROPER INPUT THING';
    const formattedValue =
        'input' in value && value.input
            ? formatValue({...value, input: replaceString}, 1).replace(
                  `"${replaceString}"`,
                  formatInput(value.input, 2).replace(/^\n\s*/, ''),
              )
            : formatValue(value, 1);
    return formatValue(`${colors.info}debug${colors.reset}:${formattedValue}`, indent);
}

function indentNewLines(input: string, indent: number) {
    return input.split('\n').join(`\n${createIndentString(indent)}`);
}

function formatValue(input: any, indent: number): string {
    const formattedInput: string =
        typeof input === 'string' ? indentNewLines(input, indent) : formatJson(input, indent);
    const output =
        (formattedInput.includes('\n') ? `\n${createIndentString(indent)}` : ' ') + formattedInput;

    return output;
}
