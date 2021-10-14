import {EmptyTestGroupError} from '../../errors/empty-test-group.error';
import {FileNotFoundError} from '../../errors/file-not-found.error';
import {Caller, emptyCaller} from '../../get-caller-file';
import {IndividualTestResult} from '../individual-test/individual-test-output';
import {ResultState} from '../result-state';
import {FilteredTestGroupOutput} from './test-group-output';

export function createEmptyTestGroupFailure(
    caller: Caller,
): IndividualTestResult<unknown, unknown>[] {
    return [
        {
            caller: caller,
            input: undefined,
            output: undefined,
            error: new EmptyTestGroupError(),
            resultState: ResultState.Error,
            success: false,
        },
    ];
}

export function createLostFileGroups(lostFiles: string[]): FilteredTestGroupOutput[] {
    return lostFiles.map((lostFilePath): FilteredTestGroupOutput => {
        const lostFileCaller = {...emptyCaller, filePath: lostFilePath};

        return {
            caller: lostFileCaller,
            description: 'File not found',
            exclude: false,
            forceOnly: false,
            tests: [
                {
                    input: () => {
                        throw new FileNotFoundError(`File not found: ${lostFilePath}`);
                    },
                    caller: lostFileCaller,
                    ignoredReason: undefined,
                },
            ],
            ignoredReason: undefined,
            fileSource: lostFilePath,
        };
    });
}
