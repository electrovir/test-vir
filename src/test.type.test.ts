import {ArrayElement} from './augment';
import {runTests} from './run-tests';
import {MatchFailStates, PassStates, ResultState, TestResult} from './test';
import {TestError} from './test-error';

function inferTestResult<ResultTypeGeneric, ErrorClassGeneric>(
    input: TestResult<ResultTypeGeneric, ErrorClassGeneric>,
) {
    return input;
}

// make sure that all states are assigned to either passing or failing states
type bucketedStates<T> = {[key in ArrayElement<typeof PassStates>]: T} &
    {[key in ArrayElement<typeof MatchFailStates>]: T} & {
        /* the error state is separate from fail and pass states */ [ResultState.Error]: T;
    };
type allStates<T> = {[key in ResultState]: T};
const bucketedStatesInstanceCheck: bucketedStates<string> = {} as bucketedStates<string>;
//
// =================================================================================
//
//                                    SUCCESSES
//
// =================================================================================
//

// if one of the enum values is not bucketed then the following line will be an error
const allStatesInstanceCheck: allStates<string> = bucketedStatesInstanceCheck;

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
