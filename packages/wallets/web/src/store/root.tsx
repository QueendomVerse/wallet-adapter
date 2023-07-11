import { configureStore } from '@reduxjs/toolkit';
import thunkMiddleware from 'redux-thunk';
import { combineReducers } from 'redux';

import { walletReducer } from './reducers/webWalletReducers';
import { store } from './dispatch';

export type RootState = ReturnType<typeof store.getState>;

const rootReducer = combineReducers({
    wallets: walletReducer,
});

export const getStore = () => {
    const store = configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunkMiddleware),
        devTools: process.env.NODE_ENV !== 'production', // Use Redux DevTools in development environment only
    });

    // console.debug('store.getState().wallets.length', store.getState().wallets.length)
    return store;
};

// Usage
/*
const store = getStore();
store.dispatch(yourActionCreator());
console.log(store.getState().wallets.length);
*/
