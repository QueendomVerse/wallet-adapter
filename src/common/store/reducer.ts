import { combineReducers } from "redux";
import {
  walletReducer,
  userReducer,
  itemReducer,
} from "./reducers/webWalletReducers";

export default combineReducers({
  users: userReducer,
  wallets: walletReducer,
  items: itemReducer,
});
