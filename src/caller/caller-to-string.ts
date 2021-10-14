import {separator} from '../strings/string-format';
import {Caller, emptyCaller} from './caller';

export function callerToString(
    input?: Caller,
    options: {line?: boolean; file?: boolean} = {
        line: true,
        file: true,
    },
): string {
    if (!input) {
        return callerToString(emptyCaller, options);
    }

    const ignoreLine =
        ('line' in options && !options.line) || input.lineNumber < 0 || input.columnNumber < 0;

    const file =
        'file' in options && !options.file ? '' : `${input.filePath}${ignoreLine ? '' : separator}`;
    const line = ignoreLine ? '' : `${input.lineNumber}${separator}${input.columnNumber}`;
    return `${file}${line}`;
}
