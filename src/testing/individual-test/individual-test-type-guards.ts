import {RequiredAndNotNullBy} from 'augment-vir';
import {
    AcceptedTestInputs,
    EmptyFunctionReturn,
    TestFunction,
    TestInputObject,
} from './individual-test-input';

export function isTestObject<ResultTypeGeneric, ErrorClassGeneric>(
    input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
): input is
    | TestInputObject<ResultTypeGeneric, ErrorClassGeneric>
    | TestInputObject<EmptyFunctionReturn, ErrorClassGeneric> {
    return typeof input !== 'function' && input.hasOwnProperty('test');
}

export function isTestFunction<ResultTypeGeneric, ErrorClassGeneric>(
    input: AcceptedTestInputs<ResultTypeGeneric, ErrorClassGeneric>,
): input is TestFunction<EmptyFunctionReturn> {
    return !isTestObject(input);
}

export function containsExpectError(
    input: any,
): input is RequiredAndNotNullBy<TestInputObject<any, any>, 'expectError'> {
    return (
        'expectError' in input &&
        input.expectError &&
        ('errorClass' in input.expectError || 'errorMessage' in input.expectError)
    );
}
