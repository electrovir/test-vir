export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType[number];
export type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
