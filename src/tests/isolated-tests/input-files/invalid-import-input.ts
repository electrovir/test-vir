// @ts-expect-error
import {invalidImport} from 'invalid-module';
import {testGroup} from '../../../test-runners/test-group';

testGroup((runTest) => {
    runTest(() => {
        invalidImport();
    });
});
