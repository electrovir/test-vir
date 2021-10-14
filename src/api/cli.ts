import {TestError} from '../errors/test.error';
import {colors} from '../formatting/colors';
import {getFinalMessage, getPassedColor} from '../formatting/did-test-pass-string';
import {formatSingleTestGroupResult} from '../formatting/format-single-test-group-result';
import {ResolvedTestGroupResults} from '../testing/test-group/test-group-output';
import {runTestFiles} from './api';

let debugMode = false;
const supportedFlags = ['--debug'];

function setFlags(flags: string[]) {
    if (flags.includes('--debug')) {
        debugMode = true;
    }

    const unsupportedFlags = flags.filter((flag) => !supportedFlags.includes(flag));

    if (unsupportedFlags.length) {
        throw new Error(`unsupported flags: ${unsupportedFlags.join(', ')}`);
    }
}

async function main(): Promise<void> {
    const {inputs, flags} = process.argv.slice(2).reduce(
        (accum, currentString) => {
            if (currentString.startsWith('--')) {
                accum.flags.push(currentString);
            } else {
                accum.inputs.push(currentString);
            }
            return accum;
        },
        {inputs: [] as string[], flags: [] as string[]},
    );

    if (flags.length) {
        setFlags(flags);
    }

    if (!inputs.length) {
        throw new TestError(
            `No files to test. Usage: test-vir <file-path-1>.js [, ...otherFilePaths].\n` +
                `Globs are also supported.`,
        );
    }
    const results: ResolvedTestGroupResults[] = await runTestFiles(inputs);

    // await each promise individually so results can print as the tests finish
    results.forEach(async (result) => {
        console.info(formatSingleTestGroupResult(result, debugMode));
    });

    const failureMessage = getFinalMessage(results);

    if (failureMessage) {
        throw new TestError(failureMessage);
    }
}

// this code is executed when run from the CLI
if (require.main === module) {
    main()
        .then(() => {
            console.info(`${getPassedColor(true)}All tests passed.${colors.reset}`);
            process.exit(0);
        })
        .catch((error) => {
            if (error instanceof TestError) {
                // this message will include coloring
                console.error(error.message);
            } else {
                console.error(`${getPassedColor(false)}Failed to run tests.${colors.reset}`);
                console.error(error);
            }
            process.exit(1);
        });
}
