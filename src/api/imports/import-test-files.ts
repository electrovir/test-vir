import {resolve} from 'path';
import {ImportError} from '../../errors/import.error';
import {getAndClearGlobalTests} from '../../testing/test-group/global-test-groups';
import {TestGroupOutput} from '../../testing/test-group/test-group-output';

export async function handleImports(
    filePaths: string[],
): Promise<{importFailures: ImportError[]; emptyFiles: string[]; testGroups: TestGroupOutput[]}> {
    const emptyFiles: string[] = [];
    const testGroups: TestGroupOutput[] = [];
    // await all the imports
    const importFailures: ImportError[] = await filePaths.reduce(
        async (lastPromise: Promise<ImportError[]>, currentFilePath): Promise<ImportError[]> => {
            const failures = await lastPromise;
            try {
                await import(resolve(currentFilePath));
                const newTestGroups = await getAndClearGlobalTests();
                if (!newTestGroups.length) {
                    emptyFiles.push(currentFilePath);
                }
                testGroups.push(
                    ...newTestGroups.map((testGroup) => {
                        return {
                            ...testGroup,
                            fileSource: currentFilePath,
                        };
                    }),
                );
            } catch (error) {
                failures.push(new ImportError(error, currentFilePath));
            }
            return failures;
        },
        Promise.resolve([]),
    );
    return {
        importFailures,
        emptyFiles,
        testGroups,
    };
}
