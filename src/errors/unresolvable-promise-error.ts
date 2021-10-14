import {TestVirError} from './test-vir.error';

/** An error which indicates that a test group contained no tests */
export class UnresolvablePromiseError extends TestVirError {
    public override readonly name = 'UnresolvablePromiseError';
    constructor(testLocation: string) {
        super(`The following test returned a promise which never resolves:\n${testLocation}`);
    }
}
