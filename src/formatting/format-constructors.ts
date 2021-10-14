/**
 * Remove the quotes around the error class name so it can be seen that it looks like a class name
 * instead of a string
 */
export function replaceErrorClassString(input: string, className?: string): string {
    if (className) {
        return input.replace(`"errorClass": "${className}"`, `"errorClass": ${className}`);
    } else {
        return input;
    }
}

/**
 * Remove the quotes around the error class name so it can be seen that it looks like a class name
 * instead of a string
 */
export function replaceConstructorStrings(input: string): string {
    return input.replace(`"Function"`, `Function`).replace(/ "(\/.*\/)"/g, ' $1');
}
