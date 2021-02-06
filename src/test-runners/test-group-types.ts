import {Caller} from '../get-caller-file';
import {ArrayElement, Overwrite, RequiredBy} from '../type-augments';
import {runIndividualTest} from './run-individual-test';
import {IndividualTestResult, TestCommonProperties} from './run-individual-test-types';

/**
 * Input parameter for the createTestGroup method. Description and test are required. Other optional
 * properties are defined in the TestCommonProperties type.
 */
export type TestGroup = RequiredBy<
    TestCommonProperties,
    'description' /* require that createTestGroup includes a description */
> & {
    tests: (testFunction: typeof runIndividualTest) => Promise<void> | void;
};

export type PromisedTestGroupOutput = Overwrite<
    ResolvedTestGroupOutput,
    Readonly<{allResults: Promise<ArrayElement<ResolvedTestGroupOutput['allResults']>>[]}>
>;

export type ResolvedTestGroupOutput = Readonly<
    Required<Omit<TestGroup, 'tests'>> & {
        allResults: IndividualTestResult<unknown, unknown>[];
        caller: Caller;
    }
>;
