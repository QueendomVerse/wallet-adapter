import type {
    FETCH_USERS_SUCCESS,
    CREATE_USER_SUCCESS,
    CREATE_PROFILE_SUCCESS,
    FETCH_PROFILES_SUCCESS,
    TOGGLE_SELECT_USER,
    UPDATED_USER_SUCCESS,
    FETCH_USER_SUCCESS,
    REMOVE_USER_SUCCESS,
    FETCH_WALLETS_SUCCESS,
    CREATE_WALLET_SUCCESS,
    TOGGLE_SELECT_WALLET,
    UPDATED_WALLET_SUCCESS,
    CREATE_AIRDROP_SUCCESS,
    CREATE_TRANSACTION_SUCCESS,
    FETCH_TRANSACTION_SUCCESS,
    CREATE_MINT_SUCCESS,
    RESTORE_WALLET_SUCCESS,
    FETCH_WALLET_SUCCESS,
    REMOVE_WALLET_SUCCESS,
    MINT_NFT_SUCCESS,
    CREATE_ITEM_SUCCESS,
    FETCH_ITEMS_SUCCESS,
} from './webWalletActionStates';
import type { LocalItemStore, LocalProfileStore, LocalUserStore, LocalWalletStore } from './webWalletTypes';

// LocalUserStore Actions
interface createUserAction {
    type: typeof CREATE_USER_SUCCESS;
    payload: LocalUserStore[];
}

interface fetchUsersAction {
    type: typeof FETCH_USERS_SUCCESS;
    payload: LocalUserStore[];
}

interface fetchUserAction {
    type: typeof FETCH_USER_SUCCESS;
    payload: LocalUserStore;
}

interface toggleUserAction {
    type: typeof TOGGLE_SELECT_USER;
    payload: string;
}

interface UpdateUserAction {
    type: typeof UPDATED_USER_SUCCESS;
    payload: LocalUserStore[];
}

interface removeUserAction {
    type: typeof REMOVE_USER_SUCCESS;
    payload: LocalUserStore;
}

interface createProfileAction {
    type: typeof CREATE_PROFILE_SUCCESS;
    payload: LocalProfileStore[];
}

interface fetchProfilesAction {
    type: typeof FETCH_PROFILES_SUCCESS;
    payload: LocalProfileStore[];
}

// LocalWalletStore Actions
interface createWalletAction {
    type: typeof CREATE_WALLET_SUCCESS;
    payload: LocalWalletStore[];
}

interface restoreWalletAction {
    type: typeof RESTORE_WALLET_SUCCESS;
    payload: LocalWalletStore[];
}

interface fetchWalletAction {
    type: typeof FETCH_WALLET_SUCCESS;
    payload: LocalWalletStore;
}

interface removeWalletAction {
    type: typeof REMOVE_WALLET_SUCCESS;
    payload: LocalWalletStore;
}

interface fetchWalletsAction {
    type: typeof FETCH_WALLETS_SUCCESS;
    payload: LocalWalletStore[];
}

interface UpdateWalletAction {
    type: typeof UPDATED_WALLET_SUCCESS;
    payload: LocalWalletStore[];
}

interface toggleWalletAction {
    type: typeof TOGGLE_SELECT_WALLET;
    payload: string;
}

interface createAirdropAction {
    type: typeof CREATE_AIRDROP_SUCCESS;
    payload: LocalWalletStore[];
}

interface createTransactionAction {
    type: typeof CREATE_TRANSACTION_SUCCESS;
    payload: LocalWalletStore[];
}

interface createMintNftAction {
    type: typeof MINT_NFT_SUCCESS;
    payload: LocalWalletStore[];
}

interface fetchTransactionAction {
    type: typeof FETCH_TRANSACTION_SUCCESS;
    payload: LocalWalletStore[];
}

interface createMintAction {
    type: typeof CREATE_MINT_SUCCESS;
    payload: LocalWalletStore[];
}

// LocalItemStore Actions
interface createItemAction {
    type: typeof CREATE_ITEM_SUCCESS;
    payload: LocalItemStore[];
}

interface fetchItemsAction {
    type: typeof FETCH_ITEMS_SUCCESS;
    payload: LocalItemStore[];
}

export type UserActionTypes =
    | fetchUsersAction
    | createUserAction
    | UpdateUserAction
    | fetchUserAction
    | removeUserAction
    | toggleUserAction
    | createProfileAction
    | fetchProfilesAction;

export type ItemActionTypes = fetchItemsAction | createItemAction;

export type WalletActionTypes =
    | fetchWalletsAction
    | createWalletAction
    | restoreWalletAction
    | fetchWalletAction
    | UpdateWalletAction
    | removeWalletAction
    | toggleWalletAction
    | createAirdropAction
    | createTransactionAction
    | createMintNftAction
    | fetchTransactionAction
    | createMintAction;
