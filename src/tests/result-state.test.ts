import {isPassState, testGroup} from '..';
import {FailStates, PassStates} from '../test-runners/result-state';

testGroup({
    description: 'result state tests',
    tests: (runTest) => {
        runTest({
            expect: false,
            test: () => isPassState(PassStates),
        });
        runTest({
            expect: false,
            test: () => isPassState('this-is-not-a-valid-state'),
        });
        runTest({
            expect: false,
            test: () => isPassState(1),
        });
        runTest({
            expect: true,
            test: () => PassStates.every((passState) => isPassState(passState)),
        });
        runTest({
            expect: false,
            test: () => FailStates.some((failState) => isPassState(failState)),
        });
    },
});
