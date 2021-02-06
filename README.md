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

<TODO: add description for actually writing tests using testGroup>

# Running Tests

Tests can be run through Node.js scripts or a CLI.

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
        (await promisedResult).allResults.forEach((individualResult) => {
            console.log(individualResult.success);
        });
    });

    // make sure to await all results before doing anything else to make sure the tests are all finished
    await Promise.all(promisedResults);
}

main();
```

[Click here for examples](https://github.com/electrovir/test-vir/blob/master/src/api/examples.ts).
