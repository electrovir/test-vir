import {Caller} from '../get-caller-file';
import {Overwrite} from '../type-augments';
import {
    AcceptedTestInputs,
    IndividualTestResult,
    TestCommonProperties,
} from './run-individual-test-types';

export type SyncTestGroupInputFunction = (testFunction: runTest) => undefined | void;
export type AsyncTestGroupInputFunction = (testFunction: runTest) => Promise<void> | void;
export type TestGroupInputFunction = SyncTestGroupInputFunction | AsyncTestGroupInputFunction;

export type SyncTestGroupInputObject = Readonly<
    TestCommonProperties & {
        tests: SyncTestGroupInputFunction;
    }
>;
export type AsyncTestGroupInputObject = Readonly<
    TestCommonProperties & {
        tests: AsyncTestGroupInputFunction;
    }
>;
export type TestGroupInputObject = AsyncTestGroupInputObject | SyncTestGroupInputObject;

/**
 * Input parameter for the testGroup method. Description and test are required. Other optional
 * properties are defined in the TestCommonProperties type.
 */
export type SyncTestGroupInput = SyncTestGroupInputObject | SyncTestGroupInputFunction;
export type AsyncTestGroupInput = AsyncTestGroupInputObject | AsyncTestGroupInputFunction;
export type TestGroupInput = SyncTestGroupInput | AsyncTestGroupInput;

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
