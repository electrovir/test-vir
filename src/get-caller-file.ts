import {relative} from 'path';
import {separator} from './string-output';

export type Caller = {
    filePath: string;
    lineNumber: number;
    columnNumber: number;
};

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

export const emptyCaller: Readonly<Caller> = {
    filePath: 'caller file not found',
    lineNumber: -1,
    columnNumber: -1,
} as const;

// I tried multiple npm packages for doing this and they all failed whereas this succeeds
export function getCaller(howFarBack: number): Caller {
    var originalFunc = Error.prepareStackTrace;

    const error = new Error();

    Error.prepareStackTrace = (_error, stack) => {
        return stack;
    };
    const stack = error.stack as unknown as NodeJS.CallSite[] | undefined;
    Error.prepareStackTrace = originalFunc;

    const fileCallSite = stack?.[howFarBack];

    if (!fileCallSite) {
        return emptyCaller;
    }
    const fileName = fileCallSite.getFileName();
    const lineNumber = fileCallSite.getLineNumber();
    const columnNumber = fileCallSite.getColumnNumber();

    if (lineNumber == undefined || fileName == undefined || columnNumber == undefined) {
        return emptyCaller;
    }

    const caller: Caller = {
        filePath: relative(process.cwd(), fileName),
        lineNumber,
        columnNumber,
    };

    return caller;
}
