type Wrapped<T> = {
    [P in keyof T]: { value: T[P]; edited: boolean };
};

export const wrap = <T extends Record<string, unknown>>(o: T): Wrapped<T> => {
    return (Object.keys(o) as Array<keyof T>).reduce<Wrapped<T>>(
        (result, key) => ({
            ...result,
            [key]: { value: o[key], edited: false },
        }),
        {} as Wrapped<T>
    );
};
