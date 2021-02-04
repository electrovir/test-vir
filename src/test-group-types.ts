import {runIndividualTest} from './run-individual-test';
import {IndividualTestResult, TestCommonProperties} from './run-individual-test-types';
import {ArrayElement, Overwrite, RequiredBy} from './types';

/**
 * Input parameter for the runTests method. Description and test are required. Other optional
 * properties are defined in the TestCommonProperties type.
 */
export type TestGroupInput = RequiredBy<
    TestCommonProperties,
    'description' /* require that runTests includes a description */
> & {
    tests: (testFunction: typeof runIndividualTest) => Promise<void> | void;
};

export type PromisedTestGroupOutput = Overwrite<
    ResolvedTestGroupOutput,
    Readonly<{allResults: Promise<ArrayElement<ResolvedTestGroupOutput['allResults']>>[]}>
>;

export type ResolvedTestGroupOutput = Readonly<
    Required<Omit<TestGroupInput, 'tests'>> & {
        allResults: IndividualTestResult<unknown, unknown>[];
        fileOrigin: string | undefined;
    }
>;
