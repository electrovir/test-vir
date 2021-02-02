import {ArrayElement, RequiredBy} from './augment';
import {runIndividualTest} from './run-individual-test';
import {TestCommonProperties, TestResult} from './test';

/**
 * Input parameter for the runTests method. Description and test are required. Other optional
 * properties are defined in the TestCommonProperties type.
 */
export type RunTestsInput = RequiredBy<
    TestCommonProperties,
    'description' /* require that runTests includes a description */
> & {
    tests: (testFunction: typeof runIndividualTest) => Promise<void> | void;
};

export type PromisedRunTestsOutput = Readonly<
    Required<Omit<RunTestsInput, 'tests'>> & {
        allResults: PromisedIndividualResults;
        fileOrigin: string | undefined;
    }
>;

export type ResolvedRunTestsOutput = Readonly<
    Required<Omit<RunTestsInput, 'tests'>> & {
        allResults: ResolvedIndividualResults;
        fileOrigin: string | undefined;
    }
>;

export type ResolvedIndividualResults = Readonly<TestResult<unknown, unknown>>[];
export type PromisedIndividualResults = Promise<ArrayElement<ResolvedIndividualResults>>[];
