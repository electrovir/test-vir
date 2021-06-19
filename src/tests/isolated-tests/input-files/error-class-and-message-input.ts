import {testGroup} from '../../../test-runners/test-group';

testGroup((runTest) => {
    runTest({
        expectError: {
            errorClass: Error,
            errorMessage: 'should fail cause the error does not contain this',
        },
        test: () => {
            throw new Error();
        },
    });
});
