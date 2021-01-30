import * as equal from 'fast-deep-equal/es6';
import {TestCommonProperties, TestResult} from '.';
import {RequiredBy} from './augment';
import {InternalVirTestError, throwInternalVirTestError} from './internal-vir-test-error';
import {AcceptedTestInputs, ErrorExpectation, ResultState, TestInputObject} from './test';
import {TestError} from './test-error';

export function isTestObject<ResultTypeGeneric, ErrorClassGeneric>(
    input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
): input is TestInputObject<ResultTypeGeneric, ErrorClassGeneric> {
    return typeof input !== 'function' && input.hasOwnProperty('test');
}

export function errorsMatch<ErrorClassGeneric>(
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

    throw new TestError('Empty error expectation: ${JSON.stringify(comparison)}');
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
async function /* This function should not be exported. It is accessed through runTests's callback. */
runTest<ResultTypeGeneric, ErrorClassGeneric>(
    input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
): Promise<Readonly<TestResult<ResultTypeGeneric, ErrorClassGeneric>>> {
    let testThrewError = false;
    let testCallbackError: unknown;
    let result: ResultTypeGeneric | undefined;

    try {
        const output = await (isTestObject(input) ? input.test() : input());
        if (output === undefined) {
            result = undefined;
        } else {
            result = output;
        }
    } catch (error) {
        testThrewError = true;
        testCallbackError = error;
    }

    let equality: boolean | undefined;

    if (isTestObject(input) && input.hasOwnProperty('expect')) {
        // check that the output matches the expectation
        try {
            equality = equal(input.expect, result);
            if (equality == undefined) {
                throw new InternalVirTestError(`equality check did not product a boolean`);
            }
        } catch (error) {
            throwInternalVirTestError(error);
        }
    }

    const baseReturnValue = {
        input,
        output: undefined,
        error: undefined,
    };
    let returnValue: TestResult<ResultTypeGeneric, ErrorClassGeneric>;

    if (testThrewError) {
        // at this point either the error matches the expected error or the test failed
        if (isTestObject(input) && 'expectError' in input) {
            // check error matching
            if (errorsMatch(testCallbackError, input.expectError)) {
                // this is an expected error and should PASS
                returnValue = {
                    ...baseReturnValue,
                    error: testCallbackError,
                    resultState: ResultState.ExpectMatchPass,
                    success: true,
                };
            } else {
                // this is an expected error and should FAIL
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
    }

    return returnValue;
}

/**
 * Input parameter for the runTests method. Description and test are required. Other optional
 * properties are defined in the TestCommonProperties type.
 */
export type RunTestsInput = RequiredBy<
    TestCommonProperties,
    'description' /* require that runTests includes a description */
> & {
    tests: (testFunction: typeof runTest) => void;
};

/**
 * Run tests. Tests are run through the callback provided to the "tests" property on the input object.
 *
 * @param input An object containing the test callback and description. See RunTestsInput for details.
 */
export function runTests(input: RunTestsInput) {
    input.tests(runTest);
}
