import {Caller} from '../../get-caller-file';
import {ResultState} from '../result-state';
import {AcceptedTestInputs} from './individual-test-input';

export type OutputWithError<ResultTypeGeneric> = ResultTypeGeneric extends undefined | void
    ? ResultTypeGeneric
    : undefined;

export type IndividualTestResult<ResultTypeGeneric, ErrorClassGeneric> = Readonly<
    //
    // SHARED STATE
    //
    | ({
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
      ))
    | {
          //
          // IGNORED STATE
          //
          caller: undefined;
          input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>;
          output: undefined;
          error: undefined;
          resultState: ResultState.Ignored;
          success: true;
      }
>;
