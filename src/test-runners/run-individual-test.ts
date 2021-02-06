import * as equal from 'fast-deep-equal';
import {throwInternalVirTestError} from '../errors/internal-vir-test-error';
import {TestError} from '../errors/test-error';
import {Caller, getCaller} from '../get-caller-file';
import {ResultState} from './result-state';
import {
    AcceptedTestInputs,
    ErrorExpectation,
    IndividualTestResult,
    OutputWithError,
    TestInputObject,
} from './run-individual-test-types';

export function isTestObject<ResultTypeGeneric, ErrorClassGeneric>(
    input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
): input is TestInputObject<ResultTypeGeneric, ErrorClassGeneric> {
    return typeof input !== 'function' && input.hasOwnProperty('test');
}

function errorsMatch<ErrorClassGeneric>(
    error: unknown,
    comparison: ErrorExpectation<ErrorClassGeneric>,
): boolean {
    try {
        if ('errorClass' in comparison) {
            return error instanceof comparison.errorClass;
        }
        if ('errorMessage' in comparison) {
            // if this as assumption is wrong then an error will be thrown will is caught later
            return (error as {message: string}).message === comparison.errorMessage;
        }
    } catch (checkError) {
        return false;
    }

    throw new TestError(`Empty error expectation: ${JSON.stringify(comparison)}`);
}

/**
 * Run a single test. These should be a small and self contained as possible.
 *
 * @param input This can be either an object that matches the TestInput type or a function. If a
 *   function, it shouldn't return anything. Failure is assumed if an error is thrown. Functions
 *   that return a value need an "expect" value (a property on the TestInput type) in order to
 *   verify the function return value. Thus, a function that returns something should be assigned
 *   to a property ("test") on the TestInput type. Async functions are allowed and are properly
 *   awaited. Deep equality checks are used on objects. Primitive, Object, Array, ArrayBuffer, Map,
 *   Set, and RegExp types are all supported.
 */
export async function /* This function should not be exported. It is accessed through createTestGroup's callback. */
runIndividualTest<ResultTypeGeneric, ErrorClassGeneric>(
    input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
    caller: Caller = getCaller(1),
): Promise<Readonly<IndividualTestResult<ResultTypeGeneric, ErrorClassGeneric>>> {
    let testThrewError = false;
    let testCallbackError: unknown;
    let testCallbackResult: ResultTypeGeneric | undefined;

    try {
        const output = await (isTestObject(input) ? input.test() : input());
        if (output === undefined) {
            // undefined is a perfectly fine subtype of ResultTypeGeneric but a possible output type
            // is also void which causes type issues so this is basically casting void to undefined
            // (which is what void is at runtime anyway)
            testCallbackResult = undefined;
        } else {
            testCallbackResult = output;
        }
    } catch (error) {
        testThrewError = true;
        testCallbackError = error;
    }

    const baseReturnValue = {
        input,
        output: undefined as OutputWithError<ResultTypeGeneric>,
        error: undefined,
        caller,
    };

    let returnValue: IndividualTestResult<ResultTypeGeneric, ErrorClassGeneric>;

    try {
        // all the different potential outcomes
        if (
            testThrewError ||
            /* if the test expects an error we want to compare the error even if there was none */
            'expectError' in input
        ) {
            // at this point either the error matches the expected error or the test failed
            if (isTestObject(input) && 'expectError' in input && input.expectError) {
                // check error matching
                if (errorsMatch(testCallbackError, input.expectError)) {
                    // this is an expected error and should PASS
                    returnValue = {
                        ...baseReturnValue,
                        error: testCallbackError,
                        resultState: ResultState.ErrorMatchPass,
                        success: true,
                    };
                } else {
                    // this is an unexpected error and should FAIL
                    returnValue = {
                        ...baseReturnValue,
                        error: testCallbackError,
                        resultState: ResultState.ErrorMatchFail,
                        success: false,
                    };
                }
            } else {
                // this is an unexpected error and should FAIL
                returnValue = {
                    ...baseReturnValue,
                    error: testCallbackError,
                    resultState: ResultState.Error,
                    success: false,
                };
            }
        } else {
            if (isTestObject(input) && 'expect' in input) {
                let areEqual: boolean | undefined;

                // wrapping this in a try catch because equal is from an external package
                try {
                    // check that the output matches the expectation
                    areEqual = equal(input.expect, testCallbackResult);
                    if (typeof areEqual !== 'boolean') {
                        throwInternalVirTestError(`equality check did not product a boolean`);
                    }
                } catch (error) {
                    throwInternalVirTestError(error);
                }

                if (areEqual) {
                    returnValue = {
                        ...baseReturnValue,
                        // testCallbackResult here is ResultTypeGeneric|undefined and undefined is a perfectly
                        // reasonable subtype of ResultTypeGeneric
                        output: testCallbackResult as ResultTypeGeneric,
                        resultState: ResultState.ExpectMatchPass,
                        success: true,
                    };
                } else {
                    returnValue = {
                        ...baseReturnValue,
                        // testCallbackResult here is ResultTypeGeneric|undefined and undefined is a perfectly
                        // reasonable subtype of ResultTypeGeneric
                        output: testCallbackResult as ResultTypeGeneric,
                        resultState: ResultState.ExpectMatchFail,
                        success: false,
                    };
                }
            } else {
                returnValue = {
                    ...baseReturnValue,
                    output: undefined,
                    resultState: ResultState.NoCheckPass,
                    success: true,
                };
            }
        }
    } catch (internalError) {
        returnValue = {
            ...baseReturnValue,
            error: internalError,
            resultState: ResultState.Error,
            success: false,
        };
    }

    return returnValue;
}