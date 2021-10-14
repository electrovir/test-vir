import {TestVirError} from './test-vir.error';

/** An error which indicates that a test, or multiple tests, failed. */
export class TestError extends TestVirError {
    public override readonly name = 'TestError';
}
