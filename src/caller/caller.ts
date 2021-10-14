export type Caller = {
    filePath: string;
    lineNumber: number;
    columnNumber: number;
};

export const emptyCaller: Readonly<Caller> = {
    filePath: 'caller file not found',
    lineNumber: -1,
    columnNumber: -1,
} as const;
