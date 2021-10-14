[![tests](https://github.com/electrovir/test-vir/workflows/tests/badge.svg)](https://github.com/electrovir/test-vir/actions)

# Test Vir

The heroic testing package.

Simple, typed, no magical globals, with CLI and JS APIs.

This currently only works with pure JavaScript: if you're using TypeScript (`.ts`) you must compile it to JS (`.js`) first. Tests verify that this runs on Mac, Linux, and Windows in Node.js (12.x and 14.x) environments.

# Install

```bash
npm i -D test-vir
```

It is likely that this package should only be included in devDependencies (as it is meant only for testing), hence the `-D` included above.

# Running Tests

Tests can be run through Node.js scripts or a CLI.

The CLI is the more common way of running tests.

# CLI

Included with this package is a CLI. This is run via the `test-vir` command.

## Test a File

```bash
test-vir path-to-file.js
```

## Test Multiple Files

```bash
test-vir path-to-file.js path-to-another-file.js
```

## Test Multiple Files Through Glob Syntax

-   If your shell works will glob expansion this will work fine

    ```bash
    test-vir ./**/*.test.js
    ```

-   If you ignore files that end in `.type.test.js`, as I do, use glob negation.

    ```bash
    test-vir ./**/!(*.type).test.js
    ```

-   If your system does _not_ support glob expansion like in the examples above, pass the glob in as a string and `test-vir` will expand it internally using [`node-glob`](https://www.npmjs.com/package/glob).

    ```bash
    test-vir "./**/!(*.type).test.js"
    ```

## Debug mode

If you want to inspect the results of your tests more, you can add the `--debug` flag to have more data printed.

# JS API

All the test runner functions are exported so they can be used in TS (or JS) Node.js scripts. These are the functions used by the CLI so all output will be identical.

## Testing Files

Use `runResolvedTestFiles` to run specific files.

<!-- example-link: src/readme-examples/testing-files.ts -->

```TypeScript
import {runResolvedTestFiles} from 'test-vir';

async function main() {
    const myFiles = ['path-to-my-test-file.js', 'path-to-another-file.js'];

    const results = await runResolvedTestFiles(myFiles);
}

main();
```

## Test Files With Glob

Globs are supported in inputs to `runResolvedTestFiles`:

<!-- example-link: src/readme-examples/testing-files-with-glob.ts -->

```TypeScript
import {runResolvedTestFiles} from 'test-vir';

async function main() {
    const myFiles = ['path-to-my-test-file.js', './**/*.test.js'];

    const results = await runResolvedTestFiles(myFiles);
}

main();
```

## Respond to File Testing One by One

The exported function `runResolvedTestFiles` resolves all promises so that all the final data is present. This means that it does not resolve until _all tests are finished_. If you wish to respond to each test as it finishes (like the CLI does, printing results as each test finishes), use `runAllTestFiles` to get an array of promises:

<!-- example-link: src/readme-examples/responding-one-by-one.ts -->

```TypeScript
import {runAllTestFiles} from 'test-vir';

async function main() {
    const myFiles = ['path-to-my-test-file.js', './**/*.test.js'];

    const promisedResults = await runAllTestFiles(myFiles);
    promisedResults.forEach(async (promisedResult) => {
        // print test success as each test finishes
        await Promise.all(
            promisedResult.allResults.map(async (individualResult) => {
                console.log(individualResult.success);
            }),
        );
    });

    // make sure to await all results before doing anything else to make sure the tests are all finished
    await Promise.all(promisedResults);
}

main();
```

# Writing Tests

For the most basic of tests, just do this:

<!-- example-link: src/readme-examples/basic-test.ts -->

```TypeScript
import {testGroup} from 'test-vir';

testGroup((runTest) =>
    // as long as the callback doesn't throw an error it'll pass
    runTest(() => {
        // do something here
    }),
);
```

## Writing Tests Details

Tests are written within the `testGroup` function. `testGroup` accepts an object of type `TestGroupInput`. The `tests` property for `TestGroupInput` accepts a function which is given a callback (`runTest`) to run individual tests. The given callback accepts inputs of type `TestInputObject`.

See the following example:

<!-- example-link: src/readme-examples/first-test-group-example.ts -->

```TypeScript
import {testGroup} from 'test-vir';

testGroup({
    description: 'my test group',
    tests: (runTest) => {
        runTest({
            expect: 5,
            test: () => {
                // this test will always fail because 3 !== 5
                return 3;
            },
        });

        // run more tests here
    },
});
```

# Examples

[See the `src/readme-examples` folder](https://github.com/electrovir/test-vir/tree/master/src/readme-examples) for examples used in this README.

# `runTest` Details

## Expectations

The `runTest` callback accepts an object that allows expectations to be set for a test. This is done through the `expect` or `expectError` properties, as seen in the example below.

Note the following rules. These rules are enforced by the type system (if you're using TypeScript).

-   `expectError` accepts an object which tests the error's constructor and/or message, like the following:

    <!-- example-link: src/readme-examples/expect-error.ts -->

    ```TypeScript
    import {testGroup} from 'test-vir';

    testGroup({
        description: 'expectError examples',
        tests: (runTest) => {
            runTest({
                expectError: {
                    // this test will pass if the test throws an error which is an instance of class Error
                    // AND the error's message matches 'hello there'
                    errorClass: Error,
                    errorMessage: 'hello there',
                },
                test: () => {
                    // since this test always throws an error of class Error and message of 'hello there',
                    // it will always pass the test
                    throw new Error('hello there');
                },
            });
            runTest({
                expectError: {
                    // this test will pass if the test throws an error which is an instance of class Error
                    errorClass: Error,
                },
                test: () => {
                    // since this test always throws an error of class Error, it will always pass the test
                    throw new Error('hello there');
                },
            });
            runTest({
                expectError: {
                    // this test will pass if the test throws an error with a message that matches 'hello there'
                    errorMessage: 'hello there',
                },
                test: () => {
                    // since this test always throws an error with message 'hello there', it will always
                    // pass the test
                    throw new Error('hello there');
                },
            });
        },
    });
    ```

-   `expect` and `expectError` cannot _both_ be set on the same test object

    <!-- example-link: src/readme-examples/expect-and-expect-error.ts -->

    ```TypeScript
    import {testGroup} from 'test-vir';

    testGroup({
        description: 'invalid expect and expectError example',
        tests: (runTest) => {
            // this is invalid
            runTest({
                // @ts-expect-error
                expect: 4,
                expectError: {
                    errorClass: Error,
                },
                // @ts-expect-error
                test: () => 3,
            });
        },
    });
    ```

-   The `expect` property _must_ be present if the test function has an expected return type and the type of the `expect` value must match that same type, as seen below:

    <!-- example-link: src/readme-examples/expect-and-return-types.ts -->

    ```TypeScript
    import {testGroup} from 'test-vir';

    testGroup({
        description: 'return type mismatch example',
        tests: (runTest) => {
            runTest({
                /**
                 * This is invalid because the test function has a return type of string but expect has
                 * a type of number.
                 */
                // @ts-expect-error
                expect: 4,
                test: () => 'hello there',
            });
            runTest({
                /** This is valid because both the test function and expect have the type of number. */
                expect: 4,
                test: () => 3,
            });
        },
    });
    ```

-   If a test function always returns [`void`](https://www.typescriptlang.org/docs/handbook/basic-types.html#void) (or nothing) then it cannot have any `expect` property (though it can have an `expectError` property) as that would also be a type mismatch.

    <!-- example-link: src/readme-examples/expect-with-void-return.ts -->

    ```TypeScript
    import {testGroup} from 'test-vir';

    testGroup({
        description: 'void return example',
        tests: (runTest) => {
            runTest({
                // this is invalid because the types don't match
                // @ts-expect-error
                expect: 4,
                test: () => {},
            });
        },
    });
    ```

-   If no `expect` _or_ `expectError` properties are set, a test passes by simply not throwing any errors.

## Extra Properties

The input object to both `testGroup` and `runTest` accept the extra properties `exclude` or `forceOnly`.

-   `exclude`, when set to true, excludes the attached `testGroup` or `runTest` from all tests. Defaults to false.
-   `forceOnly`, when set to true, forces the attached `testGroup` or `runTest` to be the _only_ test included in the results. Defaults to false. If multiple tests have this set to true, they will all be included.

## `exclude` Examples

<!-- example-link: src/readme-examples/excluding-tests.ts -->

```TypeScript
import {testGroup} from 'test-vir';

testGroup({
    description: 'my excluded test group',
    // this test group will not appear in the results because it is excluded
    exclude: true,
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
    description: 'my not excluded test group',
    tests: (runTest) => {
        runTest({
            expect: 'hello there',
            test: () => {
                return 'hello there';
            },
        });
        runTest({
            // this runTest will not appear in the results because it is excluded
            exclude: true,
            expect: 5,
            test: () => {
                return 3;
            },
        });
    },
});
```

## `forceOnly` Examples

<!-- example-link: src/readme-examples/forcing-tests.ts -->

```TypeScript
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

testGroup({
    description: 'my forced test group',
    tests: (runTest) => {
        runTest({
            // this runTest will be included in the results
            forceOnly: true,
            expect: 'hello there',
            test: () => {
                return 'hello there';
            },
        });
        // this runTest will not be included because the one above is forced
        runTest({
            expect: 5,
            test: () => {
                return 3;
            },
        });
    },
});
```
