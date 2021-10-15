import {testGroup} from '../..';

let othersRan = false;

testGroup((runTest) => {
    runTest({
        description: 'no force this one 1',
        test: () => {
            othersRan = true;
        },
    });
});
testGroup((runTest) => {
    runTest({
        description: 'no force this one 2',
        test: () => {
            othersRan = true;
        },
    });
});
testGroup((runTest) => {
    runTest({
        description: 'no force this one 3',
        test: () => {
            othersRan = true;
        },
    });
    runTest({
        description: 'force this one',
        expect: false,
        test: () => {
            return othersRan;
        },
    });
    runTest({
        description: 'no force this one 4',
        test: () => {
            othersRan = true;
        },
    });
});
testGroup((runTest) => {
    runTest({
        description: 'no force this one 5',
        test: () => {
            othersRan = true;
        },
    });
});
