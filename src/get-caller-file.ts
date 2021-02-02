import {relative} from 'path';

// I tried multiple npm packages for doing this and they all failed whereas this succeeds
export function getCallerFile(): string | undefined {
    var originalFunc = Error.prepareStackTrace;

    const error = new Error();

    Error.prepareStackTrace = (_error, stack) => {
        return stack;
    };
    const stack = (error.stack as unknown) as NodeJS.CallSite[] | undefined;
    Error.prepareStackTrace = originalFunc;

    const fullPath = stack?.[2]?.getFileName();

    if (!fullPath) {
        return undefined;
    }

    return relative(process.cwd(), fullPath) || undefined;
}
