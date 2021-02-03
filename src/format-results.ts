import {ResultState, resultStateExplanations} from './result-state';
import {ResolvedRunTestsOutput} from './run-all-tests-types';
import {isTestObject} from './run-individual-test';
import {AcceptedTestInputs, IndividualTestResult} from './run-individual-test-types';

const separator = ':';

export function formatResults(runTestsResults: Readonly<ResolvedRunTestsOutput[]>): string {
    // console.log(runTestsResults[0]?.allResults);
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

            const results = getPassedString(testFilePassed) + (testFilePassed ? '' : resultsOutput);

            const output = `${fileResults.fileOrigin}${separator} ${fileResults.description}${separator} ${results}`;
            return output;
        })
        .join('\n');
    return formattedOutput;
}

function getPassedString(passed: boolean): string {
    return passed ? 'Passed' : 'Failed';
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

    const failureReason = figureOutFailureReason(individualResult, 3).split('\n').join('\n\t');
    const failureExplanation = individualResult.success
        ? ''
        : `\n\t\t${failureReason}\n\t\tinput${separator}\t${formatInput(
              individualResult.input,
              3,
          )}`;

    const testResultOutput = `\n\t${testDescriptor}${separator} ${stateString}${failureExplanation}`;

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
                const expectObjectString = formatJson(result.input.expect, indent);
                const outputObjectString = formatJson(result.output, indent);
                return `expected${separator} ${expectObjectString}\n\tbut got${separator}  ${outputObjectString}`;
            } else {
                return 'No expectation was assigned.';
            }
        case ResultState.ErrorMatchFail:
            if (result.input && isTestObject(result.input)) {
                const expectObjectString =
                    ('expectError' in result.input &&
                        (result.input.expectError && 'errorClass' in result.input.expectError
                            ? replaceErrorClassString(
                                  formatJson(
                                      {
                                          ...result.input.expectError,
                                          errorClass: result.input.expectError.errorClass.name,
                                      },
                                      indent,
                                  ),
                                  result.input.expectError.errorClass.name,
                              )
                            : formatJson(result.input.expectError, indent))) ||
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
                const outputObjectString = formatJson(
                    (result.error && {
                        errorClass: errorClassName,
                        errorMessage: errorMessage,
                    }) ||
                        undefined,
                    indent,
                );

                return `error expected${separator}\t${expectObjectString}\n\tbut got${separator}\t${outputObjectString}`;
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
            formatJson(
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
        return formatJson(input, indent);
    }
}

function formatJson(input: any, indent: number): string {
    const indents = Array(indent)
        .fill(0)
        .map(() => '\t')
        .join('');

    const json = JSON.stringify(input, null, '\t');

    // this String cast handles the case where input is undefined, which results in JSON.stringify
    // outputting undefined instead of the string "undefined"
    return (typeof json === 'string' ? json : String(json)).split('\n').join(`\n${indents}`);
}
