import {createIndentString, separator} from '../strings/string-format';
import {IndividualTestResult} from '../testing/individual-test/individual-test-output';
import {isTestObject} from '../testing/individual-test/individual-test-type-guards';
import {ResultState} from '../testing/result-state';
import {colors} from './colors';
import {replaceErrorClassString} from './format-constructors';
import {formatValue} from './format-output';

export function generateFailureReasonString(
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
