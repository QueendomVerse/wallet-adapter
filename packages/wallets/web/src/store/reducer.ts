import { combineReducers } from 'redux';
import { itemReducer, userReducer, walletReducer } from './reducers/webWalletReducers';

export default combineReducers({
    users: userReducer,
    wallets: walletReducer,
    items: itemReducer,
});
