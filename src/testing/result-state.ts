import {ArrayElement} from 'augment-vir';

export enum ResultState {
    /** No expectations were given and no error was thrown */
    NoCheckPass = 'no-check-pass',
    /** The test callback result matched the expected output */
    ExpectMatchPass = 'expect-match-pass',
    /** The test callback result did not match the expected output (and no error was thrown) */
    ExpectMatchFail = 'expect-match-fail',
    /** The test callback threw an error and did not match the error expectation */
    ErrorMatchFail = 'error-match-fail',
    /** The test callback threw an error and the error matched the error expectation */
    ErrorMatchPass = 'error-match-pass',
    /** The test was ignored */
    Ignored = 'ignored',
    /** The test callback threw an error and no error expectation was present */
    Error = 'error',
}

export const PassStates = [
    ResultState.ExpectMatchPass,
    ResultState.NoCheckPass,
    ResultState.ErrorMatchPass,
    ResultState.Ignored,
] as const;

export const FailStates = [
    ResultState.ExpectMatchFail,
    ResultState.ErrorMatchFail,
    ResultState.Error,
] as const;

export function isPassState(input: any): input is ArrayElement<typeof PassStates> {
    return PassStates.includes(input);
}

export const resultStateExplanations: Record<ResultState, string> = {
    [ResultState.NoCheckPass]: 'No errors were thrown and the test had no expectation.',
    [ResultState.ExpectMatchPass]: 'The test output met expectations.',
    [ResultState.ExpectMatchFail]: 'The test output did not meet expectations.',
    [ResultState.ErrorMatchPass]: 'The test threw an error that met error expectations.',
    [ResultState.ErrorMatchFail]: 'The test threw an error that did not meet error expectations.',
    [ResultState.Error]: 'The test encountered an error.',
    [ResultState.Ignored]: 'The test was ignored.',
};
