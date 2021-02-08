import {FileNotFoundError} from '../errors/file-not-found-error';
import {FileNotUsedError} from '../errors/file-not-used-error';
import {callerToString} from '../get-caller-file';
import {colors, separator, tab} from '../string-output';
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

export function formatAllResults(testGroupResults: Readonly<ResolvedTestGroupResults>[]): string {
    const formattedOutput = testGroupResults
        .map((testGroup) => formatSingleResult(testGroup))
        .join('\n');
    return `${formattedOutput}\n${getFinalMessage(testGroupResults)}`;
}

function isErrorResult(input: Readonly<ResolvedTestGroupResults>, errorClass: new () => Error) {
    return input.allResults.length === 1 && input.allResults[0]?.error instanceof errorClass;
}

export function formatSingleResult(testGroupResult: Readonly<ResolvedTestGroupResults>): string {
    const testFilePassed: boolean = countFailures([testGroupResult]) === 0;
    const ignoredTestCount: number = testGroupResult.allResults.reduce((accum, result) => {
        if (result.resultState === ResultState.Ignored) {
            return accum + 1;
        }
        return accum;
    }, 0);

    const isEmptyDescription = !testGroupResult.description;
    const filePath = callerToString(testGroupResult.caller, {
        line: !isErrorResult(testGroupResult, FileNotFoundError),
    });

    const description = formatLineLeader(
        testFilePassed,
        isEmptyDescription ? filePath : testGroupResult.description,
        ignoredTestCount > 0,
    );

    // no need for any more details if the file wasn't even found
    if (
        isErrorResult(testGroupResult, FileNotFoundError) ||
        isErrorResult(testGroupResult, FileNotUsedError)
    ) {
        // if these errors are encountered, the test description is set to the error message already
        // so we can just log the description
        return `${description}${separator} ${filePath}\n`;
    }

    const ignoredTestString = ignoredTestCount ? `, ${ignoredTestCount} ignored` : '';

    const testCount = ` ${colors.reset}${ignoredTestCount ? colors.warn : ''}(${
        testGroupResult.allResults.length
    } test${testGroupResult.allResults.length === 1 ? '' : 's'}${ignoredTestString})`;

    const resultDetails = testFilePassed
        ? ''
        : testGroupResult.allResults
              .map((individualResult) => formatIndividualTestResults(individualResult))
              .join('');

    const result = `${testCount}${colors.info} ${isEmptyDescription ? '' : filePath}${
        colors.reset
    }${resultDetails}`;

    const whiteSpace = testFilePassed ? '' : '\n';

    return `${whiteSpace}${description}${result}${whiteSpace}`;
}

export function getPassedString(passed: boolean, containsWarning = false): string {
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

function formatIndividualTestResults(
    individualResult: IndividualTestResult<unknown, unknown>,
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

    const testResultOutput = `\n${tab}${description}${failureExplanation}`;

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

/**
 * Remove the quotes around the error class name so it can be seen that it looks like a class name
 * instead of a string
 */
function replaceFunctionConstructorString(input: string): string {
    return input.replace(`"Function"`, `Function`);
}

function formatInput(
    rawInput: AcceptedTestInputs<unknown, unknown> | undefined,
    indent: number,
): string {
    // include the test property even though it can't be serialized by JSON
    const inputToPrint =
        rawInput && 'test' in rawInput ? {...rawInput, test: 'Function'} : rawInput;

    if (
        inputToPrint &&
        'expectError' in inputToPrint &&
        inputToPrint.expectError &&
        'errorClass' in inputToPrint.expectError
    ) {
        return replaceFunctionConstructorString(
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
        return replaceFunctionConstructorString(formatValue(inputToPrint, indent));
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
