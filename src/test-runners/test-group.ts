import {throwInternalTestVirError} from '../errors/internal-test-vir-error';
import {getCaller} from '../get-caller-file';
import {addGlobalTest} from './global';
import {AcceptedTestInputs} from './run-individual-test-types';
import {
    TestGroupInput,
    TestGroupInputFunction,
    TestGroupInputObject,
    TestGroupOutput,
    WrappedTest,
} from './test-group-types';

function isTestGroupInputObject(input: TestGroupInput): input is TestGroupInputObject {
    return typeof input !== 'function' && input.hasOwnProperty('tests');
}

/**
 * Run tests. Tests are run through the callback provided to the "tests" property on the input object.
 *
 * @param input An object containing the test callback and description. See TestGroupInput for details.
 */
export function testGroup(input: TestGroupInput): TestGroupOutput {
    try {
        const inputTestRunner: TestGroupInputFunction = isTestGroupInputObject(input)
            ? input.tests
            : input;

        const tests: WrappedTest[] = [];

        // this is not async because we need to synchronously insert the result promises
        const wrappedRunTest = <ResultTypeGeneric, ErrorClassGeneric>(
            input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
        ): void => {
            tests.push({
                input: input as AcceptedTestInputs<unknown, unknown>,
                caller: getCaller(2),
            });
        };

        inputTestRunner(wrappedRunTest);

        const output: TestGroupOutput = {
            tests,
            caller: getCaller(2),
            ...(isTestGroupInputObject(input)
                ? {
                      description: input.description || '',
                      exclude: input.exclude || false,
                      forceOnly: input.forceOnly || false,
                  }
                : {
                      description: '',
                      exclude: false,
                      forceOnly: false,
                  }),
        };

        // insert into global results so the CLI can read it
        addGlobalTest(output);

        return output;
    } catch (error) {
        throwInternalTestVirError(`Error encountered while trying to make test group: "${error}"`);
    }
}
