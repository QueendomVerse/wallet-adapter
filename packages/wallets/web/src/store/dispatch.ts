import { configureStore } from '@reduxjs/toolkit';

import mainReducer from './reducer';

export const store = configureStore({
    reducer: mainReducer,
    devTools: process.env.NODE_ENV !== 'production',
});

export type AppDispatch = typeof store.dispatch;
