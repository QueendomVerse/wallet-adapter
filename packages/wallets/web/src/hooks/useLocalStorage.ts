import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { useLocalStorage } from '@/utils';

interface LocalStorageListener {
    key: string;
    listener: (value: string | null) => void;
}

type LocalStorageListeners = { [key: string]: LocalStorageListener[] };

const localStorageListeners: LocalStorageListeners = {};

export const useLocalStorageStringState = (defaultState = '', key?: string): [string, (newState: string) => void] => {
    const localStorage = useLocalStorage();

    const [state, setState] = useState<string>(
        typeof window !== 'undefined' ? (key && localStorage.getItem(key)) || defaultState : defaultState
    );

    const update: LocalStorageListener['listener'] = useCallback((value) => {
        setState((prevState) => (value === null ? prevState : value));
    }, []);

    useEffect(() => {
        if (!key) {
            return;
        }
        const listener: LocalStorageListener = {
            key,
            listener: update,
        };

        if (!localStorageListeners[key]) {
            localStorageListeners[key] = [];
        }

        localStorageListeners[key].push(listener);

        return () => {
            localStorageListeners[key] = localStorageListeners[key].filter(
                (locationsListener) => locationsListener.listener !== update
            );
            if (localStorageListeners[key].length === 0) {
                delete localStorageListeners[key];
            }
        };
    }, [key, update]);

    const setNewState = useCallback<(newState: string) => void>(
        (newState) => {
            if (!key) {
                return;
            }
            if (!localStorageListeners[key]) {
                localStorageListeners[key] = [];
            }
            const changed = state !== newState;
            if (!changed) {
                return;
            }

            localStorage.setItem(key, newState);

            localStorageListeners[key].forEach((listener) => listener.listener(newState));
        },
        [state, key]
    );

    return [state, setNewState];
};

export const useLocalStorageState = <T>(defaultState: T, key?: string): [T, (newState: T) => void] => {
    const [stringState, setStringState] = useLocalStorageStringState(key, JSON.stringify(defaultState));

    return [
        useMemo(() => (stringState ? (JSON.parse(stringState) as T) : defaultState), [stringState, defaultState]),
        (newState: T) => setStringState(JSON.stringify(newState)),
    ];
};
