import {TestVirError} from './test-vir.error';

/** An error which indicates that an input test file was not found */
export class FileNotFoundError extends TestVirError {
    public override readonly name = 'FileNotFoundError';
}
