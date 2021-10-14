import {emptyCaller} from '../../caller/caller';
import {FileNotUsedError} from '../../errors/file-not-used.error';
import {ResultState} from '../../testing/result-state';
import {ResolvedTestGroupResults} from '../../testing/test-group/test-group-output';

export function getUnusedFileErrorResults(unusedFiles: string[]): ResolvedTestGroupResults[] {
    return unusedFiles.map((unusedFilePath): ResolvedTestGroupResults => {
        const unusedFileCaller = {...emptyCaller, filePath: unusedFilePath};
        const result: ResolvedTestGroupResults = {
            allResults: [
                {
                    caller: unusedFileCaller,
                    error: new FileNotUsedError(`File contained no tests: ${unusedFilePath}`),
                    input: undefined,
                    output: undefined,
                    resultState: ResultState.Error,
                    success: false,
                },
            ],
            caller: unusedFileCaller,
            description: unusedFilePath,
            exclude: false,
            forceOnly: false,
            ignoredReason: undefined,
            tests: [],
            fileSource: unusedFilePath,
        };

        return result;
    });
}
