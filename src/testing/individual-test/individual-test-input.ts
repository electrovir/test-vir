import {CommonTestProperties} from '../common-test-properties';

export type ErrorMessageExpectation = string | RegExp;

export type ErrorExpectation<ErrorClassGeneric> =
    | {
          errorClass: new (...args: any[]) => ErrorClassGeneric;
      }
    | {
          errorMessage: ErrorMessageExpectation;
      }
    | {errorMessage: ErrorMessageExpectation; errorClass: new () => ErrorClassGeneric};

export type TestFunction<ResultTypeGeneric> = () => ResultTypeGeneric | Promise<ResultTypeGeneric>;

/** Input object for running an individual test via runTest's runTest callback. */
export type TestInputObject<ResultTypeGeneric, ErrorClassGeneric> = CommonTestProperties & {
    test:
        | TestFunction<ResultTypeGeneric>
        /**
         * This never type is required to allow functions which return Promise<never> without this,
         * the never cascades up the type and whole object becomes never for some reason
         */
        | TestFunction<never>;
} & (ResultTypeGeneric extends EmptyFunctionReturn
        ? // if the test function returns void then there should not be any expect
          {
              expect?: undefined;
              expectError?: ErrorExpectation<ErrorClassGeneric> | undefined;
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

export type EmptyFunctionReturn = void | never | undefined;

export type AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric> =
    | TestInputObject<ResultTypeGeneric, ErrorClassGeneric>
    /**
     * This EmptyFunctionReturn type is required to allow functions which return never without this,
     * the type assumes it should be TestFunction even when it is clearly an object
     */
    | TestInputObject<EmptyFunctionReturn, ErrorClassGeneric>
    | TestFunction<EmptyFunctionReturn>;
