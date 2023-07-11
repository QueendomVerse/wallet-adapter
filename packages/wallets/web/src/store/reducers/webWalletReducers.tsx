import type { UserActionTypes, ItemActionTypes } from '../types';
import {
    type WalletActionTypes,
    type LocalWalletStore,
    type LocalItemStore,
    type LocalUserStore,
    FETCH_USERS_SUCCESS,
    CREATE_USER_SUCCESS,
    CREATE_PROFILE_SUCCESS,
    FETCH_PROFILES_SUCCESS,
    TOGGLE_SELECT_USER,
    UPDATED_USER_SUCCESS,
    FETCH_WALLETS_SUCCESS,
    CREATE_WALLET_SUCCESS,
    TOGGLE_SELECT_WALLET,
    UPDATED_WALLET_SUCCESS,
    // CREATE_AIRDROP_SUCCESS,
    CREATE_TRANSACTION_SUCCESS,
    FETCH_TRANSACTION_SUCCESS,
    CREATE_MINT_SUCCESS,
    FETCH_ITEMS_SUCCESS,
    CREATE_ITEM_SUCCESS,
} from '../types';

const initialWalletsState: LocalWalletStore[] = [];

export const walletReducer = (state: LocalWalletStore[] = initialWalletsState, action: WalletActionTypes) => {
    switch (action.type) {
        case TOGGLE_SELECT_WALLET:
            return state.map((wlt) => {
                wlt.isSelected = wlt.gid === action.payload;
                return wlt;
            });
        case CREATE_WALLET_SUCCESS:
        case FETCH_WALLETS_SUCCESS:
        case UPDATED_WALLET_SUCCESS:
        case CREATE_TRANSACTION_SUCCESS:
        case FETCH_TRANSACTION_SUCCESS:
        case CREATE_MINT_SUCCESS:
            return state.map((wlt) => {
                return wlt;
            });
        default:
            return state;
    }
};

const initialUserState: LocalUserStore[] = [];

export const userReducer = (state: LocalUserStore[] = initialUserState, action: UserActionTypes) => {
    switch (action.type) {
        case TOGGLE_SELECT_USER: {
            return state.map((usr) => {
                usr.isSelected = usr.id === action.payload;
                return usr;
            });
        }
        case CREATE_USER_SUCCESS:
        case FETCH_USERS_SUCCESS:
        case UPDATED_USER_SUCCESS:
        case CREATE_PROFILE_SUCCESS:
        case FETCH_PROFILES_SUCCESS:
        default:
            return state;
    }
};

const initialItemState: LocalItemStore[] = [];

export const itemReducer = (state: LocalItemStore[] = initialItemState, action: ItemActionTypes) => {
    switch (action.type) {
        case CREATE_ITEM_SUCCESS:
        case FETCH_ITEMS_SUCCESS:
            return action.payload;
        default:
            return state;
    }
};
