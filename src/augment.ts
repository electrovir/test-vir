export type DeepReadonly<T> = {readonly [P in keyof T]: Readonly<T[P]>};
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType[number];
