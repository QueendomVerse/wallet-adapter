import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { useLocalStorage as baseUseLocalStorage } from './useLocalStorage';

export const useLocalStorage: typeof baseUseLocalStorage = <T>(
    _key: string,
    defaultState: T
): [T, (newValue: React.SetStateAction<T>) => Promise<void>] => {
    const [state, setState] = useState<T>(defaultState);

    useEffect(() => {
        (async () => {
            const storedValue = await AsyncStorage.getItem(_key);
            if (storedValue === null) {
                await AsyncStorage.setItem(_key, JSON.stringify(defaultState));
            } else {
                setState(JSON.parse(storedValue));
            }
        })();
    }, [_key, defaultState]);

    const setNewState = async (newValue: React.SetStateAction<T>) => {
        let valueToStore: T;

        if (typeof newValue === 'function') {
            const updaterFn = newValue as (old: T) => T;
            valueToStore = updaterFn(state);
        } else {
            valueToStore = newValue;
        }

        await AsyncStorage.setItem(_key, JSON.stringify(valueToStore));
        setState(valueToStore);
    };

    return [state, setNewState];
};
