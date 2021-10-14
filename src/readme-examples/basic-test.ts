import {testGroup} from '..';

testGroup((runTest) =>
    // as long as the callback doesn't throw an error it'll pass
    runTest(() => {
        // do something here
    }),
);
