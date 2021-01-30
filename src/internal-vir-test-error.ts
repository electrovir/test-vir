/**
 * vir-test plugin encountered an unexpected internal error. If this occurs something is seriously wrong.
 *
 * This is distinct from TestError which indicates that a test failed, which is normal behavior (tests failing).
 * This error (InternalVirTestError) indicates that something with the test runner itself failed to
 * run the test successfully. If this error is thrown, it cannot be determined whether a test failed or not.
 */
export class InternalVirTestError extends Error {
    public name = 'InternalVirTestError';
}

export function throwInternalVirTestError(input: any) {
    if (input instanceof InternalVirTestError) {
        throw input;
    } else {
        throw new InternalVirTestError(input);
    }
}
