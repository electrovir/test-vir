import {ResolvedTestGroupResults} from '../testing/test-group/test-group-output';
import {getFinalMessage} from './did-test-pass-string';
import {formatSingleTestGroupResult} from './format-single-test-group-result';

export function formatAllResults(
    testGroupResults: Readonly<ResolvedTestGroupResults>[],
    debug = false,
): string {
    const formattedOutput = testGroupResults
        .map((testGroup) => formatSingleTestGroupResult(testGroup, debug))
        .join('\n');
    return `${formattedOutput}\n${getFinalMessage(testGroupResults)}`;
}
