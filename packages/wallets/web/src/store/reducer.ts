import { combineReducers } from 'redux';
import { walletReducer } from './reducers/webWalletReducers';

export default combineReducers({
    wallets: walletReducer,
});
