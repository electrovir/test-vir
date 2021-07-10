/**
 * Test-vir plugin encountered an unexpected internal error. If this occurs something is seriously wrong.
 *
 * This is distinct from TestError which indicates that a test failed, which is normal behavior
 * (tests failing). This error (InternalTestVirError) indicates that something with the test runner
 * itself failed to run the test successfully. If this error is thrown, it cannot be determined
 * whether a test failed or not.
 *
 * This error should not be thrown directly, throwInternalTestVirError should be used instead.
 */
export class InternalTestVirError extends Error {
    public name = 'InternalTestVirError';
}

export function throwInternalTestVirError(input: any): never {
    if (input instanceof InternalTestVirError) {
        throw input;
    } else if (input instanceof Error) {
        throw new InternalTestVirError(input.message);
    } else if (typeof input === 'string') {
        throw new InternalTestVirError(input);
    } else {
        throw new InternalTestVirError(String(input));
    }
}
