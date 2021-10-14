import {testGroup} from '../../../';

testGroup((runTest) => {
    runTest(() => {
        throw new Error();
    });
});
