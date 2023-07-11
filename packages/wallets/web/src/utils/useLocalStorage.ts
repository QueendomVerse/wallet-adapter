// import { useCallback, useState } from 'react';

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

// type State = [string | null, (newState: string | null) => void]

// export const useLocalStorageState = (key: string, defaultState: string = ''): State => {
// 	const store = useLocalStorage();
// 	// By using nullish coalescing operator "??", it will use defaultState when the getItem(key) returned null or undefined.
// 	const [state, updateState] = useState<string | null>(() => store.getItem(key) ?? defaultState);
// 	const setLocalState = useCallback((newState: string | null) => {
// 		updateState(() => {
// 			if (!newState) {
// 				store.removeItem(key);
// 				return null;
// 			}
// 			store.setItem(key, JSON.stringify(newState));
// 			return newState;
// 		});
// 	}, [key]);

// 	return [state, setLocalState];
// };
