/** An error which indicates that an input test file was not used (meaning it had no tests in it) */
export class FileNotUsedError extends Error {
    public name = 'FileNotUsedError';
}
