# Test Vir

The heroic testing package.

Simple, typed, no magical globals, and contains CLI and JS APIs.

This currently only works with pure JS scripts: if you're using TS (`.ts`) you must compile it to JS (`.js`) first.

# Install

```bash
npm i -D test-vir
```

It is likely that this package should only be included in devDependencies (as it is meant only for testing), hence the `-D` included above.

# Writing Tests

Tests are written in groups with the [`testGroup`](https://github.com/electrovir/test-vir/blob/master/src/test-runners/test-group.ts#L15) function. `testGroup` accepts an object of type [`TestGroupInput`](https://github.com/electrovir/test-vir/blob/master/src/test-runners/test-group-types.ts#L10). The [`tests`](https://github.com/electrovir/test-vir/blob/master/src/test-runners/test-group-types.ts#L14) property for `TestGroupInput` accepts a function which is passed a callback by `testGroup` to run individual tests. The given callback accepts inputs of type [`TestInputObject`](https://github.com/electrovir/test-vir/blob/master/src/test-runners/run-individual-test-types.ts#L26).

See the following example:

```typescript
import {testGroup} from 'test-vir';

testGroup({
    // description is required for all every call to testGroup
    description: 'my test group',
    tests: (runTest) => {
        runTest({
            expect: 5,
            test: () => {
                // this test will always fail because 3 !== 5
                return 3;
            },
        });
    },
});
```

## `runTest` details

### Expectations

The `runTest` callback accepts an object that allows expectations to be set for a test. This is done through the `expect` or `expectError` properties, as seen in the example below.

Note the following rules. These rules are enforced by the type system (if you're using TypeScript).

-   `expectError` accepts an object which tests the error's constructor and/or message, like the following:
    ```typescript
    runTest({
        expectError: {
            // this test will pass if the test throws an error which is an instance of class Error
            // AND the error's message matches 'hello there'
            errorClass: Error,
            errorMessage: 'hello there',
        },
        test: () => {
            // since this test always throws an error of class Error and message 'hello there', it
            // will always pass the test
            throw new Error('hello there');
        },
    });
    ```
-   `expect` and `expectError` cannot _both_ be set on the same test object
    ```typescript
    runTest({
        // this is invalid
        expect: 4,
        expectError: {
            errorClass: Error,
        },
        test: () => 3,
    });
    ```
-   The `expect` property _must_ be present if the test function has an expected return type and the type of the `expect` value must match that same type, as seen below:

    ```typescript
    runTest({
        // this is invalid because the test function has a return type of string but expect has a
        // type of number
        expect: 4,
        test: () => 'hello there'
    });

    runTest({
        // this is valid because both the test function and expect have the type number
        expect: 4,
        test: () => 3
    });
    ```

-   If a test function always returns [`void`](https://www.typescriptlang.org/docs/handbook/basic-types.html#void) (or nothing) then it cannot have any `expect` property (though it can have an `expectError` property). This is the same as the expect property and test function return types not matching.
    ```typescript
    runTest({
        // this is invalid because the types don't match
        expect: 4,
        test: () => {},
    });
    ```
-   If no `expect` _or_ `expectError` properties are set, the test passes by simply not throwing any errors.

For more examples see [`expectations.ts`](https://github.com/electrovir/test-vir/tree/master/src/readme-examples/expectations.ts) in the repo source code.

## Extra properties

The input object to both `testGroup` and `runTest` accept the extra properties [`exclude`](https://github.com/electrovir/test-vir/blob/master/src/test-runners/run-individual-test-types.ts#L11) and [`forceOnly`](https://github.com/electrovir/test-vir/blob/master/src/test-runners/run-individual-test-types.ts#L13).

-   `exclude`: if set to true, this `testGroup` or `runTest` will not be included in the results. Defaults to false.
-   `forceOnly`: if set to true, this `testGroup` or `runTest` will be the _only_ test included in the results. Defaults to false.

### `exclude` examples

```typescript
import {testGroup} from 'test-vir';

// this test group will not appear in the results because it is excluded
testGroup({
    description: 'my excluded test group',
    tests: (runTest) => {
        runTest({
            expect: 5,
            test: () => {
                return 3;
            },
        });
    },
    exclude: true,
});

// this test group will appear in the results
testGroup({
    description: 'my excluded test group',
    tests: (runTest) => {
        runTest({
            expect: 'hello there',
            test: () => {
                return 'hello there';
            },
        });
        runTest({
            expect: 5,
            test: () => {
                return 3;
            },
            // this runTest will not appear in the results because it is excluded
            exclude: true,
        });
    },
});
```

### `forceOnly` examples

```typescript
import {testGroup} from 'test-vir';

// this test group will not appear in the results because the other group is forced
testGroup({
    description: 'my excluded test group',
    tests: (runTest) => {
        runTest({
            expect: 5,
            test: () => {
                return 3;
            },
        });
    },
});

// this test group will appear in the results
testGroup({
    description: 'my excluded test group',
    tests: (runTest) => {
        // this runTest will be included in the results
        runTest({
            expect: 'hello there',
            test: () => {
                return 'hello there';
            },
            forceOnly: true,
        });
        // this runTest will not be included because the one above is forced
        runTest({
            expect: 5,
            test: () => {
                return 3;
            },
        });
    },
    forceOnly: true,
});
```

# Running Tests

Tests can be run through Node.js scripts or a CLI.

Using the CLI is the recommended way of running tests.

## CLI

Included with this package is a CLI. This is run via the `test-vir` command.

### Test a file

```bash
test-vir path-to-file.js
```

### Test multiple files

```bash
test-vir path-to-file.js path-to-another-file.js
```

### Test multiple files through glob syntax

If your shell works will glob expansion this will work fine

```bash
test-vir ./**/*.test.js
```

If you ignore files that end in `.type.test.js`, as I do, use glob negation.

```bash
test-vir ./**/!(*.type).test.js
```

If your system does _not_ support glob expansion like in the examples above, pass the glob in as a string and `test-vir` will expand it internally using [`node-glob`](https://www.npmjs.com/package/glob).

```bash
test-vir "./**/!(*.type).test.js"
```

## JS API

All the test functions are exported so that they can be used in TS (or JS) Node.js scripts. These are used by the CLI so all output will be identical.

### Reading test output directly

<TODO: add description for reading output of testGroup directly>

### Testing files

```typescript
import {runResolvedTestFiles} from 'test-vir';

async function main() {
    const myFiles = ['path-to-my-test-file.js', 'path-to-another-file.js'];

    const results = await runResolvedTestFiles(myFiles);
}

main();
```

#### Test files with glob

If any file strings are not found a actual file names they will be expanded to all matching actual file names.

```typescript
import {runResolvedTestFiles} from 'test-vir';

async function main() {
    const myFiles = ['path-to-my-test-file.js', './**/*.test.js'];

    const results = await runResolvedTestFiles(myFiles);
}

main();
```

#### Respond to file testing one by one

The exported function `runResolvedTestFiles` resolves all promises so that all the final data is present. This means that it does not resolve until _all tests are finished_. If you wish to respond to each test as it finishes (like the CLI does, printing results as each test finishes), use `runAllTestFiles` to get an array of promises:

```typescript
import {runAllTestFiles} from 'test-vir';

async function main() {
    const myFiles = ['path-to-my-test-file.js', './**/*.test.js'];

    const promisedResults = await runAllTestFiles(myFiles);
    promisedResults.forEach(async (promisedResult) => {
        // print test success as each test finishes
        await Promise.all(
            promisedResult.allResults.map(async (individualResult) => {
                console.log((await individualResult).success);
            }),
        );
    });

    // make sure to await all results before doing anything else to make sure the tests are all finished
    await Promise.all(promisedResults);
}

main();

```
