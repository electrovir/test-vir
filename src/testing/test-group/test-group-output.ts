import {Overwrite} from 'augment-vir';
import {Caller} from '../../get-caller-file';
import {AcceptedTestInputs} from '../individual-test/individual-test-input';
import {IndividualTestResult} from '../individual-test/individual-test-output';
import {TestGroupInputObject} from './test-group-input';

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
