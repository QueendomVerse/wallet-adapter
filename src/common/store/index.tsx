import { combineReducers, applyMiddleware, createStore } from "redux";
import thunkMiddleware from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";

import {
  userReducer,
  walletReducer,
  itemReducer,
} from "./reducers/webWalletReducers";

const rootReducer = combineReducers({
  wallets: walletReducer,
  users: userReducer,
  items: itemReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default function configureStore() {
  const middlewares = [thunkMiddleware];
  const middleWareEnchancer = applyMiddleware(...middlewares);

  const store = createStore(
    rootReducer,
    composeWithDevTools(middleWareEnchancer)
  );
  // console.debug('store.getState().wallets.length', store.getState().wallets.length)
  return store;
}
