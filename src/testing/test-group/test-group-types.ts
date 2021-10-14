import {Overwrite} from 'augment-vir';
import {Caller} from '../../get-caller-file';
import {CommonTestProperties} from '../common-test-properties';
import {AcceptedTestInputs} from '../individual-test/individual-test-input';
import {IndividualTestResult} from '../individual-test/individual-test-output';

export type SyncTestGroupInputFunction = (testFunction: runTest) => undefined | void;
export type AsyncTestGroupInputFunction = (testFunction: runTest) => Promise<void> | void;
export type TestGroupInputFunction = SyncTestGroupInputFunction | AsyncTestGroupInputFunction;

export interface SyncTestGroupInputObject extends Readonly<CommonTestProperties> {
    readonly tests: SyncTestGroupInputFunction;
}
export interface AsyncTestGroupInputObject extends Readonly<CommonTestProperties> {
    readonly tests: AsyncTestGroupInputFunction;
}
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
        fileSource: string | undefined;
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
