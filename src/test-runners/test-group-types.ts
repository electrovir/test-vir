import {Caller} from '../get-caller-file';
import {ArrayElement, Overwrite, RequiredBy} from '../type-augments';
import {
    AcceptedTestInputs,
    IndividualTestResult,
    TestCommonProperties,
} from './run-individual-test-types';

/**
 * Input parameter for the testGroup method. Description and test are required. Other optional
 * properties are defined in the TestCommonProperties type.
 */
export type TestGroupInput = RequiredBy<
    TestCommonProperties,
    'description' /* require that testGroup includes a description */
> & {
    tests: (testFunction: runTest) => Promise<void> | void;
};

export type runTest = <ResultTypeGeneric, ErrorClassGeneric>(
    input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
) => void;

export enum IgnoredReason {
    Excluded = 'Excluded',
    NonForced = 'NonForced',
}

export type TestGroupOutput = Readonly<
    Required<Omit<TestGroupInput, 'tests'>> & {
        tests: WrappedTest[];
        caller: Caller;
    }
>;

export type WrappedTest = {
    input: AcceptedTestInputs<unknown, unknown>;
    caller: Caller;
};

export type FilteredTestGroupOutput = Readonly<
    Required<
        Overwrite<TestGroupOutput, {tests: FilteredWrappedTest[]}> & {
            ignored: IgnoredReason | undefined;
        }
    >
>;

export type FilteredWrappedTest = Readonly<
    WrappedTest & {
        ignored: IgnoredReason | undefined;
    }
>;

export type PromisedResult = Promise<ArrayElement<ResolvedTestGroupResults['allResults']>>;

export type PromisedTestGroupResults = Overwrite<
    ResolvedTestGroupResults,
    Readonly<{allResults: PromisedResult[]}>
>;

export type ResolvedTestGroupResults = Readonly<
    Required<FilteredTestGroupOutput> & {
        allResults: IndividualTestResult<unknown, unknown>[];
    }
>;
