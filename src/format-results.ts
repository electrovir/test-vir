import {TestResult} from './test';

export function formatResults(input: Readonly<TestResult<unknown, unknown>>[]): string {
    return JSON.stringify(input, null, 4);
}
