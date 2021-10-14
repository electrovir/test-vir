import {separator} from '../strings/string-format';
import {ResolvedTestGroupResults} from '../testing/test-group/test-group-output';
import {colors} from './colors';
import {countFailures} from './count-failures';

export function getPassedString(passed: boolean, containsWarning = false): string {
    return `${getPassedColor(passed, containsWarning)}${passed ? `Passed` : `Failed`}`;
}

export function getPassedColor(passed: boolean, containsWarning = false): string {
    const passedColor = containsWarning ? colors.warn : colors.success;

    return `${colors.bold}${passed ? passedColor : colors.fail}`;
}

export function getFinalMessage(testGroupResults: Readonly<ResolvedTestGroupResults>[]) {
    const failures = countFailures(testGroupResults);

    return failures > 0
        ? `${getPassedColor(false)}${failures} test${failures === 1 ? '' : 's'} failed${
              colors.reset
          }`
        : '';
}

export function formatLineLeader(
    success: boolean,
    description: string,
    containsWarning = false,
): string {
    return `${getPassedString(success, containsWarning)}${separator} ${description}`;
}
