import {createIndentString, indentNewLines} from '../strings/string-format';
import {IndividualTestResult} from '../testing/individual-test/individual-test-output';
import {ResolvedTestGroupResults} from '../testing/test-group/test-group-output';
import {colors} from './colors';
import {formatInput} from './format-input';

export function formatJson(input: any, indent: number): string {
    const json = JSON.stringify(input, null, createIndentString(1));

    // this String cast handles the case where input is undefined, which results in JSON.stringify
    // outputting undefined instead of the string "undefined"
    return indentNewLines(typeof json === 'string' ? json : String(json), indent);
}

export function formatDebugOutput(
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

export function formatValue(input: any, indent: number): string {
    const formattedInput: string =
        typeof input === 'string' ? indentNewLines(input, indent) : formatJson(input, indent);
    const output =
        (formattedInput.includes('\n') ? `\n${createIndentString(indent)}` : ' ') + formattedInput;

    return output;
}
