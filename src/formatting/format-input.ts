import {AcceptedTestInputs} from '../testing/individual-test/individual-test-input';
import {replaceConstructorStrings, replaceErrorClassString} from './format-constructors';
import {formatValue} from './format-output';

export function formatInput(
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
