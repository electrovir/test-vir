import {TestVirError} from './test-vir.error';

/** An error which indicates that a test group contained no tests */
export class EmptyTestGroupError extends TestVirError {
    public override readonly name = 'EmptyTestGroupError';
}
