import {globalResults} from '../api/global-results';
import {throwInternalVirTestError} from '../errors/internal-vir-test-error';
import {TestError} from '../errors/test-error';
import {getCaller} from '../get-caller-file';
import {resolveTestGroupOutput} from './resolve-test-group-output';
import {runIndividualTest} from './run-individual-test';
import {AcceptedTestInputs, IndividualTestResult} from './run-individual-test-types';
import {PromisedTestGroupOutput, ResolvedTestGroupOutput, TestGroup} from './test-group-types';

/**
 * Run tests. Tests are run through the callback provided to the "tests" property on the input object.
 *
 * @param input An object containing the test callback and description. See TestGroupInput for details.
 */
export async function createTestGroup(input: TestGroup): Promise<ResolvedTestGroupOutput> {
    // run time description checks
    if (!input.description || typeof input.description !== 'string') {
        throw new TestError(`Invalid test description: "${input.description}"`);
    }

    const resultPromises: Promise<IndividualTestResult<unknown, unknown>>[] = [];

    // this is not async because we need to synchronously insert the result promises
    const wrappedRunTest = <ResultTypeGeneric, ErrorClassGeneric>(
        input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
    ): Promise<Readonly<IndividualTestResult<ResultTypeGeneric, ErrorClassGeneric>>> => {
        const result = runIndividualTest(input, getCaller(2));
        resultPromises.push(result as any);
        return result;
    };
    const promisedResults: PromisedTestGroupOutput = {
        allResults: resultPromises,
        description: input.description,
        exclude: input.exclude || false,
        forceOnly: input.forceOnly || false,
        caller: getCaller(2),
    };

    // insert into global results so the CLI can read it
    globalResults.push(promisedResults);

    try {
        await input.tests(wrappedRunTest);
        return resolveTestGroupOutput(promisedResults);
    } catch (error) {
        // this should not happen because runTest should be catching all test errors
        console.error(error);
        throwInternalVirTestError(`Test error was not caught by runTest: "${error}"`);
    }
}
