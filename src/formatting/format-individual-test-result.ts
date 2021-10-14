import {IndividualTestResult} from '..';
import {callerToString} from '../get-caller-file';
import {createIndentString, separator} from '../strings/string-format';
import {isTestObject} from '../testing/individual-test/individual-test-type-guards';
import {ResultState, resultStateExplanations} from '../testing/result-state';
import {colors} from './colors';
import {formatLineLeader} from './did-test-pass-string';
import {generateFailureReasonString} from './failure-reason';
import {formatInput} from './format-input';
import {formatDebugOutput} from './format-output';

export function formatIndividualTestResult(
    individualResult: IndividualTestResult<any, unknown>,
    debug = false,
): string {
    const testDescriptor: string =
        (individualResult.input &&
            isTestObject(individualResult.input) &&
            individualResult.input.description) ||
        `${callerToString(individualResult.caller, {
            file: false,
        })}`;

    const description = `${formatLineLeader(
        individualResult.success,
        testDescriptor,
        individualResult.resultState === ResultState.Ignored,
    )}${colors.reset}${separator} ${resultStateExplanations[individualResult.resultState]}`;

    const failureReason = generateFailureReasonString(individualResult, 2)
        .split('\n')
        .join(`\n${createIndentString(1)}`);
    const inputString = individualResult.input
        ? `\n${createIndentString(2)}${colors.info}input${colors.reset}${separator}${formatInput(
              individualResult.input,
              3,
          )}`
        : '';

    const failureExplanation = individualResult.success
        ? ''
        : `\n${createIndentString(2)}${failureReason}${inputString}`;

    const debugOutput = debug ? formatDebugOutput(individualResult, 2) : '';
    const testResultOutput = `\n${createIndentString(
        1,
    )}${description}${failureExplanation}${debugOutput}`;

    return testResultOutput;
}
