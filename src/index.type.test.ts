import {ResultState} from './result-state';
import {
    AcceptedTestInputs,
    IndividualTestResult,
    TestInputObject,
} from './run-individual-test-types';
import {TestError} from './test-error';
import {createTestGroup} from './test-group';

/**
 * This file utilizes the "// @ts-expect-error" comment to write type assignment failure cases which
 * will cause the TypeScript compilation to fail if there ISN'T an error. (See the failure cases
 * section below to see it in use.)
 */

// helper functions

function inferTestResult<ResultTypeGeneric, ErrorClassGeneric>(
    input: IndividualTestResult<ResultTypeGeneric, ErrorClassGeneric>,
) {
    return input;
}

function inferTestInput<ResultTypeGeneric, ErrorClassGeneric>(
    input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
) {
    return input;
}

function inferTestObject<ResultTypeGeneric, ErrorClassGeneric>(
    input: TestInputObject<ResultTypeGeneric, ErrorClassGeneric>,
) {
    return input;
}

//
// =================================================================================
//
//                                    SUCCESSES
//
// =================================================================================
//

type dummyResult = {
    output: any;
    error: any;
    success: any;
    input: any;
    resultState: ResultState;
};
const dummyResult: dummyResult = {} as dummyResult;
// if this fails then it is likely that a ResultState was left out of the definition for TestResult
inferTestResult(dummyResult);

createTestGroup({
    description: '',
    tests: (runTest) => {
        runTest(() => undefined);
        runTest({expect: 3, test: () => 5});
        runTest({expect: 'forty five', test: () => 'hi there'});
        runTest({expect: new Date(), test: () => new Date()});
        runTest({test: () => {}});
        runTest({
            expect: 3,
            test: () => {
                if (Math.random() > 0.5) {
                    return undefined;
                } else {
                    return Math.random();
                }
            },
        });
        runTest({
            expect: undefined,
            test: () => {
                if (Math.random() > 0.5) {
                    return undefined;
                } else {
                    return Math.random();
                }
            },
        });

        // types work with error inputs
        runTest({
            test: () => {
                const hello = 'give';
            },
            expectError: {
                errorClass: TestError,
            },
        });
        runTest({
            test: () => {
                const hello = 'give';
            },
            expectError: {
                errorClass: Error,
                errorMessage: 'yolo',
            },
        });
        runTest({
            // cannot ignore expect if expectError is present
            expectError: {
                errorClass: TestError,
            },
            test: () => {
                return Math.random();
            },
        });
        runTest({
            expectError: {
                errorClass: Error,
            },
            description: 'test with error expect',
            test: async () => {
                throw new Error('herp derp');
            },
        });
    },
});

inferTestObject({
    expectError: {
        errorClass: Error,
    },
    description: 'test with error expect',
    test: async () => {
        throw new Error('herp derp');
    },
});

inferTestInput({
    expectError: {
        errorClass: Error,
    },
    description: 'test with error expect',
    test: async () => {
        throw new Error('herp derp');
    },
});

inferTestResult({
    input: {
        test: () => {},
    },
    output: undefined,
    error: new Error(),
    resultState: ResultState.Error,
    success: false,
});

inferTestResult({
    input: {
        test: () => 5,
        expect: 5,
    },
    output: undefined,
    error: new Error(),
    resultState: ResultState.Error,
    success: false,
});

//
// =================================================================================
//
//                                    FAILURES
//
// =================================================================================
//
//                       everything below here SHOULD fail
//

createTestGroup({
    description: 'description',
    tests: (runTest) => {
        // tests that return a value must include an expectation
        // @ts-expect-error
        runTest({test: () => 5});
        // @ts-expect-error
        runTest({test: () => new Date()});
        // @ts-expect-error
        runTest({test: () => 'hi there'});
        // @ts-expect-error
        runTest(() => 5);
        // a test with an expectation must return a value
        // @ts-expect-error
        runTest({expect: 4, test: () => {}});
        runTest({
            test: () => {
                const hello = 'give';
            },
            expectError: {
                // error class must be a constructor
                // @ts-expect-error
                errorClass: 'fdasfsa',
                errorMessage: 'yolo',
            },
        });
        runTest({
            test: () => {
                const hello = 'give';
            },
            // expect error can't be empty
            // @ts-expect-error
            expectError: {},
        });

        runTest({
            // cannot have both expect and expect error
            // @ts-expect-error
            expect: 1,
            expectError: {
                errorClass: TestError,
            },
            test: () => {
                return Math.random();
            },
        });
    },
});

// missing description
// @ts-expect-error
createTestGroup({
    tests: (runTest) => {},
});

// output should match test function return type (which in this case is void)
inferTestResult({
    input: {
        test: () => {},
    },
    // @ts-expect-error
    output: '5',
    error: new Error(),
    resultState: ResultState.Error,
    success: false,
});

// output must be undefined when in the error state
// @ts-expect-error
inferTestResult({
    input: {
        test: () => 5,
        expect: 5,
    },
    output: 5,
    error: new Error(),
    resultState: ResultState.Error,
    success: false,
});

// expect should match test output type (which in this case is a number)
inferTestResult({
    input: {
        test: () => 5,
        // @ts-expect-error
        expect: 'fdafda',
    },
    output: undefined,
    error: new Error(),
    resultState: ResultState.Error,
    success: false,
});

// expect should match test output type (which in this case is a number)
inferTestResult({
    input: {
        test: () => 5,
        // @ts-expect-error
        expect: 'fdafda',
    },
    output: undefined,
    error: undefined,
    resultState: ResultState.Error,
    success: false,
});
