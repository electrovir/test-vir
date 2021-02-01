import {runTests} from './run-tests';
import {ResultState, TestResult} from './test';
import {TestError} from './test-error';

// this file should not be included in the typescript compilation but can be checked in an editor
// (VS Code) to see if both sections correctly fail and pass, respectively.

function inferTestResult<ResultTypeGeneric, ErrorClassGeneric>(
    input: TestResult<ResultTypeGeneric, ErrorClassGeneric>,
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
declare const thingie: dummyResult;
// if this fails then it is likely that a ResultState was left out of the definition for TestResult
inferTestResult(thingie);

runTests({
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

runTests({
    description: '',
    tests: (runTest) => {
        // tests that return a value must include an expectation
        runTest({test: () => 5});
        runTest({test: () => new Date()});
        runTest({test: () => 'hi there'});
        runTest(() => 5);
        // a test with an expectation must return a value
        runTest({expect: 4, test: () => {}});
        runTest({
            test: () => {
                const hello = 'give';
            },
            expectError: {
                // error class must be a constructor
                errorClass: 'fdasfsa',
                errorMessage: 'yolo',
            },
        });
        runTest({
            test: () => {
                const hello = 'give';
            },
            // expect error can't be empty
            expectError: {},
        });
    },
});

// missing description
runTests({
    tests: (runTest) => {},
});

// output should match test function return type (which in this case is void)
inferTestResult({
    input: {
        test: () => {},
    },
    output: '5',
    error: new Error(),
    resultState: ResultState.Error,
    success: false,
});

// output must be undefined when in the error state
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
        expect: 'fdafda',
    },
    output: undefined,
    error: undefined,
    resultState: ResultState.Error,
    success: false,
});
