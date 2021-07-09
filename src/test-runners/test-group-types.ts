import {Caller} from '../get-caller-file';
import {Overwrite} from '../type-augments';
import {
    AcceptedTestInputs,
    IndividualTestResult,
    TestCommonProperties,
} from './run-individual-test-types';

export type TestGroupInputFunction = (testFunction: runTest) => Promise<void> | void;

export type TestGroupInputObject = Readonly<
    TestCommonProperties & {
        tests: TestGroupInputFunction;
    }
>;

/**
 * Input parameter for the testGroup method. Description and test are required. Other optional
 * properties are defined in the TestCommonProperties type.
 */
export type TestGroupInput = TestGroupInputObject | TestGroupInputFunction;

export type runTest = <ResultTypeGeneric, ErrorClassGeneric>(
    input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
) => void;

export enum IgnoredReason {
    Excluded = 'Excluded',
    NonForced = 'NonForced',
}

export type TestGroupOutput = Readonly<
    Required<Omit<TestGroupInputObject, 'tests'>> & {
        tests: WrappedTest[];
        caller: Caller;
    }
>;

export type WrappedTest = {
    input: AcceptedTestInputs<unknown, unknown>;
    caller: Caller;
};

type IgnoredReasonObject = {
    ignoredReason: IgnoredReason | undefined;
};

export type FilteredTestGroupOutput = Readonly<
    Required<Overwrite<TestGroupOutput, {tests: FilteredWrappedTest[]}> & IgnoredReasonObject>
>;

export type FilteredWrappedTest = Readonly<WrappedTest & IgnoredReasonObject>;

export type ResolvedTestGroupResults = Readonly<
    Required<FilteredTestGroupOutput> & {
        allResults: IndividualTestResult<unknown, unknown>[];
    }
>;
