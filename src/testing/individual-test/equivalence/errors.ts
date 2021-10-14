import {TestError} from '../../../errors/test-error';
import {ErrorExpectation} from '../individual-test-input';

export function doErrorsMatch<ErrorClassGeneric>(
    error: unknown,
    comparison: ErrorExpectation<ErrorClassGeneric>,
): boolean {
    try {
        let errorClassMatch = true;
        if ('errorClass' in comparison) {
            errorClassMatch = error instanceof comparison.errorClass;
        }
        let errorMessageMatch = true;
        if ('errorMessage' in comparison) {
            if (error && typeof error === 'object' && 'message' in error) {
                const message: string = String((error as {message: unknown}).message);

                if (typeof comparison.errorMessage === 'string') {
                    // if this as assumption is wrong then an error will be thrown will is caught later
                    errorMessageMatch = message === comparison.errorMessage;
                } else {
                    errorMessageMatch = !!(comparison.errorMessage.exec(message) || []).length;
                }
            } else {
                errorMessageMatch = false;
            }
        }

        return errorClassMatch && errorMessageMatch;
    } catch (checkError) {
        return false;
    }

    throw new TestError(`Empty error expectation: ${JSON.stringify(comparison)}`);
}
