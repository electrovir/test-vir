import {testGroup} from '../test-runners/test-group';

testGroup((runTest) => {
    runTest(() => {
        throw new Error();
    });
});
