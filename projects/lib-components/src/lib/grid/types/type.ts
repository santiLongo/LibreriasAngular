export type InternalItem<T> = {
  __uuid: string;
  data: T;
};

export const uuid = (): string => {
    return crypto.randomUUID();
}