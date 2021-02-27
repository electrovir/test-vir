import {testGroup} from '../../test-runners/test-group';

testGroup((runTest) => {
    runTest({
        description: 'Unresolvable promise',
        expect: 1,
        test: async () => {
            const neverEndingPromise = await new Promise<number>(() => {});
            return (await Promise.all([neverEndingPromise]))[0];
        },
    });
});
