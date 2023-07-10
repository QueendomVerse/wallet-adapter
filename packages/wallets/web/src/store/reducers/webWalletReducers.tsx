import {
    type WalletActionTypes,
    type LocalWallet,
    FETCH_WALLETS_SUCCESS as _FETCH_WALLETS_SUCCESS,
    CREATE_WALLET_SUCCESS as _CREATE_WALLET_SUCCESS,
    TOGGLE_SELECT_WALLET as _TOGGLE_SELECT_WALLET,
    UPDATED_WALLET_SUCCESS as _UPDATED_WALLET_SUCCESS,
    CREATE_TRANSACTION_SUCCESS as _CREATE_TRANSACTION_SUCCESS,
    FETCH_TRANSACTION_SUCCESS as _FETCH_TRANSACTION_SUCCESS,
    CREATE_MINT_SUCCESS as _CREATE_MINT_SUCCESS,
} from '../types';

const initialWalletsState: LocalWallet[] = [];

export const walletReducer = (state: LocalWallet[] = initialWalletsState, action: WalletActionTypes) => {
    switch (action.type) {
        case _TOGGLE_SELECT_WALLET:
            return state.map((wlt) => {
                wlt.isSelected = wlt.gid === action.payload;
                return wlt;
            });
        case _CREATE_WALLET_SUCCESS:
        case _FETCH_WALLETS_SUCCESS:
        case _UPDATED_WALLET_SUCCESS:
        case _CREATE_TRANSACTION_SUCCESS:
        case _FETCH_TRANSACTION_SUCCESS:
        case _CREATE_MINT_SUCCESS:
            return state.map((wlt) => {
                return wlt;
            });
        default:
            return state;
    }
};
