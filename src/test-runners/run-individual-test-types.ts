import {Caller} from '../get-caller-file';
import {ResultState} from './result-state';

export type TestFunction<ResultTypeGeneric> = () => ResultTypeGeneric | Promise<ResultTypeGeneric>;

/** Properties that are allowed in the runTest's input parameter and its runTest callback input parameter. */
export type TestCommonProperties = {
    description?: string;

    /** If set to true, don't run this test or test group defaults to undefined (false) */
    exclude?: boolean;
    /** It set to true, ONLY run this test or test group defaults to undefined (false) */
    forceOnly?: boolean;
};

export type ErrorExpectation<ErrorClassGeneric> =
    | {
          errorClass: new () => ErrorClassGeneric;
      }
    | {
          errorMessage: string;
      }
    | {errorMessage: string; errorClass: new () => ErrorClassGeneric};

/** Input object for running an individual test via runTest's runTest callback. */
export type TestInputObject<ResultTypeGeneric, ErrorClassGeneric> = TestCommonProperties & {
    test:
        | TestFunction<ResultTypeGeneric>
        /**
         * this never type is required to allow functions which return never
         * without this, the never cascades up the whole type and whole object becomes never for some reason
         */
        | TestFunction<never>;
} & (ResultTypeGeneric extends emptyFunctionReturn
        ? // if the test function returns void then there should not be any expect
          {
              expect?: undefined;
              expectError?: ErrorExpectation<ErrorClassGeneric>;
          }
        : // if the test function returns something an expect must be present
          | {
                    // cannot have both expect and expectError
                    expect: ResultTypeGeneric;
                    expectError?: undefined;
                }
              | {
                    expect?: undefined;
                    expectError: ErrorExpectation<ErrorClassGeneric>;
                });

export type emptyFunctionReturn = void | never | undefined;

export type AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric> =
    | TestInputObject<ResultTypeGeneric, ErrorClassGeneric>
    | TestFunction<emptyFunctionReturn>;

export type OutputWithError<ResultTypeGeneric> = ResultTypeGeneric extends undefined | void
    ? ResultTypeGeneric
    : undefined;

export type IndividualTestResult<ResultTypeGeneric, ErrorClassGeneric> = Readonly<
    //
    // SHARED STATE
    //
    {
        caller: Caller;
    } & (
        | //
        // SUCCESS STATES
        //
        ({
              input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>;
          } & (
              | {
                    // output expect success state
                    output: ResultTypeGeneric;
                    error: undefined;
                    resultState: ResultState.ExpectMatchPass;
                    success: true;
                }
              | {
                    // no check and no error success state
                    output: undefined;
                    error: undefined;
                    resultState: ResultState.NoCheckPass;
                    success: true;
                }
              | {
                    // error expect success state
                    output: OutputWithError<ResultTypeGeneric>;
                    error: unknown;
                    resultState: ResultState.ErrorMatchPass;
                    success: true;
                }
              //
              // FAILURE STATES
              //
              | {
                    // result expect failure state
                    output: ResultTypeGeneric;
                    error: undefined;
                    resultState: ResultState.ExpectMatchFail;
                    success: false;
                }
              | {
                    // error expect failure state
                    output: ResultTypeGeneric | undefined;
                    error: unknown;
                    resultState: ResultState.ErrorMatchFail;
                    success: false;
                }
          ))
        | {
              //
              // ERROR STATE
              //
              // error state is allowed an undefined input because errors can occur before the tests have even started
              input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric> | undefined;
              output: OutputWithError<ResultTypeGeneric>;
              error: unknown;
              resultState: ResultState.Error;
              success: false;
          }
    )
>;
