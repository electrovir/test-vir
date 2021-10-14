import {TestGroupInput, TestGroupInputObject} from './test-group-input';

export function isTestGroupInputObject(input: TestGroupInput): input is TestGroupInputObject {
    return typeof input !== 'function' && input.hasOwnProperty('tests');
}
