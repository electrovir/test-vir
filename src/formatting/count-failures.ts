import {ResolvedTestGroupResults} from '../testing/test-group/test-group-output';

export function countFailures(testGroupResults: Readonly<ResolvedTestGroupResults>[]): number {
    return testGroupResults.reduce((count, singleTestGroupResult) => {
        return (
            count +
            singleTestGroupResult.allResults.reduce((innerCount, individualTestResult) => {
                return innerCount + Number(!individualTestResult.success);
            }, 0)
        );
    }, 0);
}
