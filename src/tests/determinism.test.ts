import {testGroup} from '..';

const globalObject = {
    a: 'hello there',
    b: 'you are a bold one',
};

testGroup((runTest) => {
    runTest({
        expect: true,
        description: 'async test that could be interrupted',
        test: async () => {
            const testValue = 'what now';
            globalObject.a = testValue;
            return await new Promise<boolean>((resolve) => {
                setTimeout(() => {
                    resolve(globalObject.a === testValue);
                }, 200);
            });
        },
    });

    runTest({
        expect: true,
        description: 'interrupting sync test',
        test: () => {
            const testValue = 'this is the wrong value';
            globalObject.a = testValue;
            return globalObject.a === testValue;
        },
    });
});
