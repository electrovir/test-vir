import {throwInternalTestVirError} from '../errors/internal-test-vir-error';
import {TestError} from '../errors/test-error';
import {getCaller} from '../get-caller-file';
import {addGlobalTest} from './global-tests';
import {AcceptedTestInputs} from './run-individual-test-types';
import {TestGroupInput, TestGroupOutput, WrappedTest} from './test-group-types';

/**
 * Run tests. Tests are run through the callback provided to the "tests" property on the input object.
 *
 * @param input An object containing the test callback and description. See TestGroupInput for details.
 */
export function testGroup(input: TestGroupInput): TestGroupOutput {
    try {
        // run time description checks
        if (!input.description || typeof input.description !== 'string') {
            throw new TestError(`Invalid test description: "${input.description}"`);
        }

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

        input.tests(wrappedRunTest);

        const output: TestGroupOutput = {
            tests,
            description: input.description,
            exclude: input.exclude || false,
            forceOnly: input.forceOnly || false,
            caller: getCaller(2),
        };

        // insert into global results so the CLI can read it
        addGlobalTest(output);

        return output;
    } catch (error) {
        throwInternalTestVirError(`Error encountered while trying to make test group: "${error}"`);
    }
}
