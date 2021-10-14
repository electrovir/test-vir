import {relative} from 'path';
import {Caller, emptyCaller} from './caller';

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
