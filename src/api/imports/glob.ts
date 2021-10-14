import {existsSync} from 'fs';
import {promise as glob} from 'glob-promise';

/**
 * Treats all input strings as file names. If one of the strings cannot be matched to a valid file,
 * it is executed as a glob and the found files there are included in the output. If still no files
 * are found, the original string is simply included in the output.
 *
 * Thus, the output of this function can include missing files which should still be handled
 * downstream. The output will not contain duplicates.
 */
export async function expandGlobs(inputs: string[]): Promise<string[]> {
    const foundFiles = new Set<string>();
    const lostFiles = new Set<string>();

    await Promise.all(
        inputs.map(async (input) => {
            if (existsSync(input)) {
                foundFiles.add(input);
            } else {
                // try glob expansion
                const globFoundFiles: string[] = await glob(input);
                if (globFoundFiles.length > 0) {
                    globFoundFiles.forEach((file) => foundFiles.add(file));
                } else {
                    // we really couldn't find anything
                    lostFiles.add(input);
                }
            }
        }),
    );

    // combine all files, later in the pipeline we'll handle missing ones
    return Array.from(foundFiles).concat(Array.from(lostFiles));
}
