import {testGroup} from '../../..';

export function runIndirectTest() {
    testGroup((runTest) => {
        runTest({
            description: 'blank test',
            expect: '',
            test: () => '',
        });
    });
}
