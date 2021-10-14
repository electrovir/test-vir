import {isTestObject} from '../individual-test/individual-test-type-guards';
import {
    FilteredTestGroupOutput,
    FilteredWrappedTest,
    IgnoredReason,
    TestGroupOutput,
    WrappedTest,
} from './test-group-output';

export type AlmostFilteredTestGroupOutput = Omit<FilteredTestGroupOutput, 'ignoredReason'>;

/** Sets the given ignored reason on the given test. */
function setIgnored(
    input: AlmostFilteredTestGroupOutput,
    reason: IgnoredReason | undefined,
): FilteredTestGroupOutput;
function setIgnored(input: WrappedTest, reason: IgnoredReason | undefined): FilteredWrappedTest;
function setIgnored(
    input: WrappedTest | AlmostFilteredTestGroupOutput,
    reason: IgnoredReason | undefined,
): typeof input extends WrappedTest ? FilteredWrappedTest : FilteredTestGroupOutput;
function setIgnored(
    input: WrappedTest | AlmostFilteredTestGroupOutput,
    reason: IgnoredReason | undefined,
): FilteredWrappedTest | FilteredTestGroupOutput {
    return {
        ...input,
        ignoredReason: reason,
    };
}

function combineTests({
    forced,
    nonExcluded,
    excluded,
}: {
    forced: WrappedTest[];
    nonExcluded: WrappedTest[];
    excluded: WrappedTest[];
}): FilteredWrappedTest[];
function combineTests({
    forced,
    nonExcluded,
    excluded,
}: {
    forced: AlmostFilteredTestGroupOutput[];
    nonExcluded: AlmostFilteredTestGroupOutput[];
    excluded: AlmostFilteredTestGroupOutput[];
}): FilteredTestGroupOutput[];
function combineTests({
    forced,
    nonExcluded,
    excluded,
}: {
    forced: (AlmostFilteredTestGroupOutput | WrappedTest)[];
    nonExcluded: (AlmostFilteredTestGroupOutput | WrappedTest)[];
    excluded: (AlmostFilteredTestGroupOutput | WrappedTest)[];
}): FilteredTestGroupOutput[] | FilteredWrappedTest[] {
    return [
        ...(forced.length
            ? [
                  ...forced.map((test) => setIgnored(test, undefined)),
                  ...nonExcluded.map((test) => setIgnored(test, IgnoredReason.NonForced)),
              ]
            : [...forced, ...nonExcluded].map((test) => setIgnored(test, undefined))),
        ...excluded.map((test) => setIgnored(test, IgnoredReason.Excluded)),
    ];
}

/** Filters excluded and forced tests */
export function filterTestGroups(testGroups: TestGroupOutput[]): FilteredTestGroupOutput[] {
    const nonExcludedGroups: AlmostFilteredTestGroupOutput[] = [];
    const forcedGroups: AlmostFilteredTestGroupOutput[] = [];
    const excludedGroups: AlmostFilteredTestGroupOutput[] = [];

    testGroups.forEach((testGroup) => {
        const nonExcludedTests: WrappedTest[] = [];
        const forcedTests: WrappedTest[] = [];
        const excludedTests: WrappedTest[] = [];

        testGroup.tests.forEach((wrappedTest) => {
            if (isTestObject(wrappedTest.input)) {
                if (wrappedTest.input.forceOnly) {
                    forcedTests.push(wrappedTest);
                } else if (wrappedTest.input.exclude) {
                    excludedTests.push(wrappedTest);
                } else {
                    nonExcludedTests.push(wrappedTest);
                }
            } else {
                nonExcludedTests.push(wrappedTest);
            }
        });

        const combinedTests: FilteredWrappedTest[] = combineTests({
            forced: forcedTests,
            excluded: excludedTests,
            nonExcluded: nonExcludedTests,
        });

        const newTests: AlmostFilteredTestGroupOutput = {
            ...testGroup,
            tests: combinedTests,
        };

        if (forcedTests.length || testGroup.forceOnly) {
            forcedGroups.push(newTests);
        } else if (testGroup.exclude) {
            excludedGroups.push(newTests);
        } else {
            nonExcludedGroups.push(newTests);
        }
    });

    return combineTests({
        forced: forcedGroups,
        excluded: excludedGroups,
        nonExcluded: nonExcludedGroups,
    });
}
