import {
  User,
  UserActionTypes,
  FETCH_USERS_SUCCESS,
  CREATE_USER_SUCCESS,
  CREATE_PROFILE_SUCCESS,
  FETCH_PROFILES_SUCCESS,
  TOGGLE_SELECT_USER,
  UPDATED_USER_SUCCESS,
  WalletActionTypes,
  Wallet,
  FETCH_WALLETS_SUCCESS,
  CREATE_WALLET_SUCCESS,
  TOGGLE_SELECT_WALLET,
  UPDATED_WALLET_SUCCESS,
  CREATE_AIRDROP_SUCCESS,
  CREATE_TRANSACTION_SUCCESS,
  FETCH_TRANSACTION_SUCCESS,
  CREATE_MINT_SUCCESS,
  Item,
  ItemActionTypes,
  FETCH_ITEMS_SUCCESS,
  CREATE_ITEM_SUCCESS,
} from "../types/webWalletTypes";

const initialWalletsState: Wallet[] = [];

export const walletReducer = (
  state: Wallet[] = initialWalletsState,
  action: WalletActionTypes
) => {
  //@TODO add proper return types here?
  switch (action.type) {
    case TOGGLE_SELECT_WALLET:
      const updatedSelectionState = state.map((wlt) => {
        wlt.isSelected = wlt.gid === action.payload;
        return wlt;
      });
      return updatedSelectionState;
    case CREATE_WALLET_SUCCESS:
    case FETCH_WALLETS_SUCCESS:
    // return action.payload;
    case UPDATED_WALLET_SUCCESS:
    // return action.payload
    case CREATE_AIRDROP_SUCCESS:
    case CREATE_TRANSACTION_SUCCESS:
    case FETCH_TRANSACTION_SUCCESS:
    case CREATE_MINT_SUCCESS:
      // return action.payload;
      const updatedMintSuccessState = state.map((wlt) => {
        return wlt;
      });
      return updatedMintSuccessState;
    default:
      return state;
  }
};

const initialUserState: User[] = [];

export const userReducer = (
  state: User[] = initialUserState,
  action: UserActionTypes
) => {
  switch (action.type) {
    case TOGGLE_SELECT_USER:
      const updatedState = state.map((usr) => {
        usr.isSelected = usr.id === action.payload;
        return usr;
      });
      return updatedState;
    case CREATE_USER_SUCCESS:
    case FETCH_USERS_SUCCESS:
    // // return action.payload;
    // const fetchedState = state.map((usr) => {
    //   return usr;
    // });
    // console.error('FETCH_USERS_SUCCESS')
    // console.table(fetchedState)
    // console.error('action.payload')
    // console.table(action.payload)
    // // return fetchedState;
    // return state;
    // return action.payload;
    case UPDATED_USER_SUCCESS:
    case CREATE_PROFILE_SUCCESS:
    case FETCH_PROFILES_SUCCESS:
    default:
      return state;
  }
};

const initialItemState: Item[] = [];

export const itemReducer = (
  state: Item[] = initialItemState,
  action: ItemActionTypes
) => {
  switch (action.type) {
    case CREATE_ITEM_SUCCESS:
    case FETCH_ITEMS_SUCCESS:
      return action.payload;
    default:
      return state;
  }
};
