type StorageReturn = {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
    isUpdated: (key: string) => boolean;
    clear: () => void;
};

export const useLocalStorage = (): StorageReturn => {
    const hasWindow = typeof window !== 'undefined';

    const getItem = (key: string): string | null => (hasWindow ? window.localStorage.getItem(key) : null);

    const setItem = (key: string, value: string): void => {
        if (hasWindow) window.localStorage.setItem(key, value);
    };

    const removeItem = (key: string): void => {
        if (hasWindow) window.localStorage.removeItem(key);
    };

    const isUpdated = (key: string): boolean => Boolean(getItem(key));

    const clear = (): void => {
        if (hasWindow) window.localStorage.clear();
    };

    return { getItem, setItem, removeItem, isUpdated, clear };
};
