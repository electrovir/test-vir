import {TestVirError} from './test-vir.error';

/** An error which indicates that an input test file was not used (meaning it had no tests in it) */
export class FileNotUsedError extends TestVirError {
    public override readonly name = 'FileNotUsedError';
}
