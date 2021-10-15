// @ts-expect-error
import {invalidImport} from 'invalid-module';
import {testGroup} from '../..';

testGroup((runTest) => {
    runTest(() => {
        invalidImport();
    });
});
