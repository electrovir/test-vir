export class ImportError extends Error {
    constructor(public readonly error: any, public readonly filePath: string) {
        super(error);
    }
}
