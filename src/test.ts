import {ArrayElement} from './augment';

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
    test: TestFunction<ResultTypeGeneric>;
} & (ResultTypeGeneric extends void
        ? // if the test function returns void then there should not be any expect
          {}
        : // if the test function returns something an expect must be present
          {
              expect: ResultTypeGeneric;
          }) &
    (
        | {
              expectError: ErrorExpectation<ErrorClassGeneric>;
          }
        | {}
    );

export enum ResultState {
    /**
     * no expectations were given and no error was thrown
     */
    NoCheckPass = 'no-check-pass',
    /**
     * the test callback result matched the expected output
     */
    ExpectMatchPass = 'expect-match-pass',
    /**
     * the test callback result did not match the expected output (and no error was thrown)
     */
    ExpectMatchFail = 'expect-match-fail',
    /**
     * the test callback threw an error and did not match the error expectation
     */
    ErrorMatchFail = 'error-match-fail',
    /**
     * the test callback threw an error and the error matched the error expectation
     */
    ErrorMatchPass = 'error-match-pass',
    /**
     * the test callback threw an error and no error expectation was present
     */
    Error = 'error',
}

export const PassStates = [
    ResultState.ExpectMatchPass,
    ResultState.NoCheckPass,
    ResultState.ErrorMatchPass,
] as const;
// ResultState.Error is intentionally left out of FailStates
export const MatchFailStates = [ResultState.ErrorMatchFail, ResultState.ExpectMatchFail] as const;

export function isPassState(input: any): input is ArrayElement<typeof PassStates> {
    return PassStates.includes(input);
}

export type AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric> =
    | TestInputObject<ResultTypeGeneric, ErrorClassGeneric>
    | TestFunction<void>;

export type TestResult<ResultTypeGeneric, ErrorClassGeneric> =
    // shared state
    {
        input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>;
    } & (
        | // success state
        {
              output: ResultTypeGeneric;
              // allow error here because a potential pass case is when an error is thrown that matches expectations
              error: unknown;
              resultState: ArrayElement<typeof PassStates>;
              success: true;
          }
        // error state
        | {
              output: undefined;
              error: any;
              resultState: ResultState.Error;
              success: false;
          }
        // failure state
        | {
              output: ResultTypeGeneric;
              error: undefined;
              resultState: ArrayElement<typeof MatchFailStates>;
              success: false;
          }
    );
