import * as styles from 'ansi-styles';

export const colors = {
    info: styles.blue.open,
    fail: styles.red.open,
    warn: styles.yellow.open,
    success: styles.green.open,
    reset: styles.reset.close,
    bold: styles.bold.open,
} as const;

const tab = '    ';

export const separator = `:`;

export function createIndentString(indent: number): string {
    return Array(indent)
        .fill(0)
        .map(() => `${tab}`)
        .join('');
}
