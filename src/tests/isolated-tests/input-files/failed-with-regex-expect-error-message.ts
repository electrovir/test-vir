import {testGroup} from '../../../test-runners/test-group';

testGroup((runTest) => {
    runTest({
        description: 'should format regex as string',
        expectError: {
            errorMessage: /test regex/,
        },
        test: () => {
            return 'do nothing';
        },
    });
});
