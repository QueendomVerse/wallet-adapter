import { configureStore } from '@reduxjs/toolkit';

import mainReducer from './reducer';
import { useDispatch } from 'react-redux';

export const store = configureStore({
    reducer: mainReducer,
    devTools: process.env.NODE_ENV !== 'production',
});

export type AppDispatch = typeof store.dispatch;
