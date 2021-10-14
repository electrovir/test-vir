/** This file is used in test group names and in formatting so it must be agnostic to both. */
const tab = '    ';

export const separator = `:`;

export function createIndentString(indent: number): string {
    return Array(indent)
        .fill(0)
        .map(() => `${tab}`)
        .join('');
}

export function indentNewLines(input: string, indent: number) {
    return input.split('\n').join(`\n${createIndentString(indent)}`);
}
