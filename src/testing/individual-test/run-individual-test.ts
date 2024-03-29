import {addExitCallback, removeExitCallback} from 'catch-exit';
import equal from 'fast-deep-equal';
import {Caller} from '../../caller/caller';
import {callerToString} from '../../caller/caller-to-string';
import {getCaller} from '../../caller/get-caller';
import {throwInternalTestVirError} from '../../errors/internal-test-vir.error';
import {UnresolvablePromiseError} from '../../errors/unresolvable-promise.error';
import {ResultState} from '../result-state';
import {doErrorsMatch} from './equivalence/errors';
import {AcceptedTestInputs} from './individual-test-input';
import {IndividualTestResult, OutputWithError} from './individual-test-output';
import {containsExpectError, isTestFunction, isTestObject} from './individual-test-type-guards';

/**
 * Run a single test. These should be a small and self contained as possible.
 *
 * @param input This can be either an object that matches the TestInput type or a function. If a
 *   function, it shouldn't return anything. Failure is assumed if an error is thrown. Functions
 *   that return a value need an "expect" value (a property on the TestInput type) in order to
 *   verify the function return value. Thus, a function that returns something should be assigned to
 *   a property ("test") on the TestInput type. Async functions are allowed and are properly
 *   awaited. Deep equality checks are used on objects. Primitive, Object, Array, ArrayBuffer, Map,
 *   Set, and RegExp types are all supported.
 */
export async function /* This function should not be exported from the package. It is accessed through testGroup's callback. */
runIndividualTest<ResultTypeGeneric, ErrorClassGeneric>(
    input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
    caller: Caller = getCaller(1),
): Promise<Readonly<IndividualTestResult<ResultTypeGeneric, ErrorClassGeneric>>> {
    function earlyExitCallback() {
        const testDescription =
            isTestObject(input) && input.description ? `${input.description}\n}` : '';

        const testLocation = `${testDescription}${callerToString(caller)}`;
        throw new UnresolvablePromiseError(testLocation);
    }

    let testThrewError = false;
    let testCallbackError: unknown;
    let testCallbackResult: ResultTypeGeneric | undefined;

    try {
        addExitCallback(earlyExitCallback);
        const output = await (isTestFunction(input) ? input() : input.test());
        // this is used to catch tests with an unresolvable promise and at least log an error message
        // otherwise the process just exits with no information

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
    } finally {
        removeExitCallback(earlyExitCallback);
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
            containsExpectError(input)
        ) {
            // at this point either the error matches the expected error or the test failed
            if (isTestObject(input) && containsExpectError(input)) {
                // check error matching
                if (doErrorsMatch(testCallbackError, input.expectError)) {
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
                        throwInternalTestVirError(`equality check did not product a boolean`);
                    }
                } catch (error) {
                    throwInternalTestVirError(`Error running a test: ${error}`);
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
