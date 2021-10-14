import {Caller, emptyCaller} from '../../caller/caller';
import {ImportError} from '../../errors/import.error';
import {ResultState} from '../../testing/result-state';
import {ResolvedTestGroupResults} from '../../testing/test-group/test-group-output';

export function generatedFailedImportResults(failures: ImportError[]): ResolvedTestGroupResults[] {
    return failures.map((failure): ResolvedTestGroupResults => {
        const errorCaller: Caller = {...emptyCaller, filePath: failure.filePath};
        const result: ResolvedTestGroupResults = {
            allResults: [
                {
                    caller: errorCaller,
                    error: failure.error,
                    input: undefined,
                    output: undefined,
                    resultState: ResultState.Error,
                    success: false,
                },
            ],
            caller: errorCaller,
            description: failure.filePath,
            exclude: false,
            forceOnly: false,
            ignoredReason: undefined,
            tests: [],
            fileSource: failure.filePath,
        };

        return result;
    });
}
