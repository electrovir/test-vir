import * as styles from 'ansi-styles';

export const colors = {
    info: styles.blue.open,
    fail: styles.red.open,
    warn: styles.yellow.open,
    success: styles.green.open,
    reset: styles.reset.close,
    bold: styles.bold.open,
} as const;

export const tab = '    ';

export const separator = `:`;
