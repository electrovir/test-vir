# TestVir

The heroic testing package.

# Examples

```typescript
// runTests call must happen first, runTest is then accessed in the "tests" callback.
Examples: RunTests({
    description: 'example tests',
    tests: runTest => {
        // just a function as the input with no return value.
        RunTest(() => {
            checkThatSomethingWorks();
        });
        // object input with no return value
        RunTest({
            test: () => {
                checkThatSomethingWorks();
            },
        });
        // type of expect must match the return type of the test function
        RunTest({
            test: () => {
                return checkThatSomethingWorks();
            },
            expect: 'worked',
        });
        // optional object input parameters
        RunTest({
            test: () => {
                return checkThatSomethingWorks();
            },
            expect: 'worked',
        });
    },
});
```
