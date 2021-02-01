import equal = require('fast-deep-equal');
import {RequiredBy} from './augment';
import {getCallerFile} from './get-caller-file';
import {InternalVirTestError, throwInternalVirTestError} from './internal-vir-test-error';
import {
    AcceptedTestInputs,
    ErrorExpectation,
    ResultState,
    TestCommonProperties,
    TestInputObject,
    TestResult,
} from './test';
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
        output: undefined,
        error: undefined,
    };
    let returnValue: TestResult<ResultTypeGeneric, ErrorClassGeneric>;

    // all the different potential outcomes
    if (testThrewError) {
        // at this point either the error matches the expected error or the test failed
        if (isTestObject(input) && 'expectError' in input) {
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
                    throw new InternalVirTestError(`equality check did not product a boolean`);
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
                resultState: ResultState.NoCheckPass,
                success: true,
            };
        }
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
    tests: (testFunction: typeof runTest) => Promise<void> | void;
};

type PromisedGlobalResults = Required<Omit<RunTestsInput, 'tests'>> & {
    allResults: Promise<Readonly<TestResult<unknown, unknown>>>[];
    fileOrigin: string | undefined;
};
export type ResolvedGlobalResults = Required<Omit<RunTestsInput, 'tests'>> & {
    allResults: Readonly<TestResult<unknown, unknown>>[];
    fileOrigin: string | undefined;
};

const globalResults: PromisedGlobalResults[] = [];

export async function getGlobalResults(): Promise<Readonly<ResolvedGlobalResults[]>> {
    return Promise.all(
        globalResults.map(
            async (
                resultsEntry: PromisedGlobalResults,
            ): Promise<Readonly<ResolvedGlobalResults>> => {
                const allResults = await Promise.all(resultsEntry.allResults);

                const resolvedResults: ResolvedGlobalResults = {
                    ...resultsEntry,
                    allResults,
                };

                return resolvedResults;
            },
        ),
    );
}

/**
 * Run tests. Tests are run through the callback provided to the "tests" property on the input object.
 *
 * @param input An object containing the test callback and description. See RunTestsInput for details.
 */
export async function runTests(
    input: RunTestsInput,
): Promise<Readonly<TestResult<unknown, unknown>>[]> {
    const resultPromises: Promise<Readonly<TestResult<unknown, unknown>>>[] = [];

    // this is not async because we need to synchronously insert the result promises
    const wrappedRunTest = <ResultTypeGeneric, ErrorClassGeneric>(
        input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
    ): Promise<Readonly<TestResult<ResultTypeGeneric, ErrorClassGeneric>>> => {
        const result = runTest(input);
        resultPromises.push(result as any);
        return result;
    };
    globalResults.push({
        allResults: resultPromises,
        description: input.description,
        exclude: input.exclude || false,
        forceOnly: input.forceOnly || false,
        fileOrigin: getCallerFile(),
    });

    try {
        try {
            await input.tests(wrappedRunTest);
        } catch (error) {
            // this should not happen because runTest should be catching all test errors
            console.error(error);
            throw new InternalVirTestError(`Test error was not caught by runTest: "${error}"`);
        }
        const results = await Promise.all(resultPromises);
        // return the results in case the consumer wishes to use this method in ways other than the CLI
        return results;
    } catch (error) {
        // this should not happen because runTest should be catching all test errors
        console.error(error);
        throw new InternalVirTestError(`Error processing test results: "${error}"`);
    }
}
