import {throwInternalTestVirError} from '../../errors/internal-test-vir.error';
import {getCaller} from '../../get-caller-file';
import {AcceptedTestInputs} from '../individual-test/individual-test-input';
import {addGlobalTest} from './global-test-groups';
import {isTestGroupInputObject} from './test-group-guards';
import {
    AsyncTestGroupInput,
    SyncTestGroupInput,
    TestGroupInput,
    TestGroupInputFunction,
} from './test-group-input';
import {TestGroupOutput, WrappedTest} from './test-group-output';

/**
 * Run tests. Tests are run through the callback provided to the "tests" property on the input object.
 *
 * @param input An object containing the test callback and description. See TestGroupInput for details.
 */
export function testGroup(input: SyncTestGroupInput): TestGroupOutput;
export function testGroup(input: AsyncTestGroupInput): Promise<TestGroupOutput>;
export function testGroup(input: TestGroupInput): TestGroupOutput | Promise<TestGroupOutput> {
    try {
        const inputTestRunner: TestGroupInputFunction = isTestGroupInputObject(input)
            ? input.tests
            : input;

        const caller = getCaller(2);

        const tests: WrappedTest[] = [];
        function createOutput(): TestGroupOutput {
            return {
                tests,
                caller,
                fileSource: undefined,
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
        }

        const wrappedRunTest = <ResultTypeGeneric, ErrorClassGeneric>(
            input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
        ): void => {
            tests.push({
                input: input as AcceptedTestInputs<unknown, unknown>,
                caller,
            });
        };

        const nothing = inputTestRunner(wrappedRunTest);

        // this function only needs to return a promise if the input includes an async callback
        if (nothing instanceof Promise) {
            const outputPromise: Promise<TestGroupOutput> = nothing.then(() => {
                return createOutput();
            });

            // insert into global results so the CLI can read it
            addGlobalTest(outputPromise);

            return outputPromise;
        } else {
            const output: TestGroupOutput = createOutput();

            // insert into global results so the CLI can read it
            addGlobalTest(Promise.resolve(output));

            return output;
        }
    } catch (error) {
        throwInternalTestVirError(`Error while running testGroup: "${error}"`);
    }
}
