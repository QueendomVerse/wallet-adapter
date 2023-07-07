import { combineReducers } from 'redux';
//@TODO: Get rid of these two extra reducers
import dashboardReducer from './reducers/dashboardReducer';
import callReducer from './reducers/callReducer';
import {
  walletReducer
} from './reducers/webWalletReducers';

export default combineReducers({
  dashboard: dashboardReducer,
  call: callReducer,
  wallets: walletReducer
});
