import {TestVirError} from './test-vir.error';

export class ImportError extends TestVirError {
    public override readonly name = 'ImportError';
    constructor(public readonly error: any, public readonly filePath: string) {
        super(error);
    }
}
