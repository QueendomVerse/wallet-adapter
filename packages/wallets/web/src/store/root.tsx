import { configureStore } from '@reduxjs/toolkit';
import thunkMiddleware from 'redux-thunk';
import { combineReducers } from 'redux';

import { walletReducer } from './reducers/webWalletReducers';

const rootReducer = combineReducers({
    wallets: walletReducer,
});

const getStore = () => {
    const store = configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunkMiddleware),
        devTools: process.env.NODE_ENV !== 'production', // Use Redux DevTools in development environment only
    });

    // console.debug('store.getState().wallets.length', store.getState().wallets.length)
    return store;
};

export default getStore;

// Usage
/*
const store = getStore();
store.dispatch(yourActionCreator());
console.log(store.getState().wallets.length);
*/
