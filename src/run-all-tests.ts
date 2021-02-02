import {getCallerFile} from './get-caller-file';
import {globalResults} from './global-results';
import {InternalVirTestError} from './internal-vir-test-error';
import {resolveRunTestsOutput} from './resolve-run-tests-output';
import {PromisedRunTestsOutput, ResolvedRunTestsOutput, RunTestsInput} from './run-all-tests-types';
import {runIndividualTest} from './run-individual-test';
import {AcceptedTestInputs, IndividualTestResult} from './run-individual-test-types';

/**
 * Run tests. Tests are run through the callback provided to the "tests" property on the input object.
 *
 * @param input An object containing the test callback and description. See RunTestsInput for details.
 */
export async function runTests(input: RunTestsInput): Promise<ResolvedRunTestsOutput> {
    const resultPromises: Promise<IndividualTestResult<unknown, unknown>>[] = [];

    // this is not async because we need to synchronously insert the result promises
    const wrappedRunTest = <ResultTypeGeneric, ErrorClassGeneric>(
        input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
    ): Promise<Readonly<IndividualTestResult<ResultTypeGeneric, ErrorClassGeneric>>> => {
        const result = runIndividualTest(input);
        resultPromises.push(result as any);
        return result;
    };
    const promisedResults: PromisedRunTestsOutput = {
        allResults: resultPromises,
        description: input.description,
        exclude: input.exclude || false,
        forceOnly: input.forceOnly || false,
        fileOrigin: getCallerFile(),
    };

    // insert into global results so the CLI can read it
    globalResults.push(promisedResults);

    try {
        await input.tests(wrappedRunTest);
        return resolveRunTestsOutput(promisedResults);
    } catch (error) {
        // this should not happen because runTest should be catching all test errors
        console.error(error);
        throw new InternalVirTestError(`Test error was not caught by runTest: "${error}"`);
    }
}
