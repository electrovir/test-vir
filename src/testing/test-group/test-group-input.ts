import {CommonTestProperties} from '../common-test-properties';
import {AcceptedTestInputs} from '../individual-test/individual-test-input';

export type runTest = <ResultTypeGeneric, ErrorClassGeneric>(
    input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
) => void;

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
