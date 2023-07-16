import type { Action } from 'redux';
import {
    Keypair,
    Connection,
    Transaction as SolanaTransaction,
    sendAndConfirmTransaction,
    // SystemProgram,
    PublicKey,
    clusterApiUrl,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { ThunkAction } from 'redux-thunk';
import type { FinalExecutionOutcome } from 'near-api-js/lib/providers';

import type {
    ApiUser,
    ApiWallet,
    ApiItem,
    Chain,
    LocalItemStore,
    LocalKeypairStore,
    LocalTransactionStore,
    LocalUserStore,
    LocalWalletStore,
} from '@mindblox-wallet-adapter/base';
import { getChainProp, ChainNetworks } from '@mindblox-wallet-adapter/base';
import { notify } from '@mindblox-wallet-adapter/react';
import type { Send, MintNearNft } from '@mindblox-wallet-adapter/networks';
import { mintNearNft } from '@mindblox-wallet-adapter/networks';
import { getBalance, sendFundsTransaction } from '@mindblox-wallet-adapter/networks';
import { connectionManager, ConnectionError } from '@mindblox-wallet-adapter/solana';

import type { IndexDbItem } from '../../indexDb';
import {
    type IndexDbWallet,
    type IndexDbUser,
    getSavedIndexDbUsers,
    getSavedIndexDbUser,
    saveIndexDbUser,
    updateIndexDbUser,
    updateIndexDbWallet,
    // getIndexDbUserProfiles,
    // getIndexDbUserWallets,
    saveIndexDbProfile,
    updateIndexDbProfile,
    getSavedIndexDbWalletMatches,
    getSavedIndexDbWallets,
    saveIndexDbWallet,
    removeIndexDbWallet,
    getSavedIndexDbMints,
    saveIndexDbMint,
    getSavedIndexDbUserMatches,
    removeIndexDbUser,
    // getSavedIndexDbUserById,
} from '../../indexDb';
import {
    CREATE_WALLET_SUCCESS as _CREATE_WALLET_SUCCESS,
    RESTORE_WALLET_SUCCESS as _RESTORE_WALLET_SUCCESS,
    FETCH_WALLETS_SUCCESS as _FETCH_WALLETS_SUCCESS,
    // FETCH_WALLET_SUCCESS,
    UPDATED_WALLET_SUCCESS as _UPDATED_WALLET_SUCCESS,
    REMOVE_WALLET_SUCCESS as _REMOVE_WALLET_SUCCESS,
    TOGGLE_SELECT_WALLET as _TOGGLE_SELECT_WALLET,
    // MINT_NFT_SUCCESS,
    CREATE_TRANSACTION_SUCCESS as _CREATE_TRANSACTION_SUCCESS,
    FETCH_TRANSACTION_SUCCESS as _FETCH_TRANSACTION_SUCCESS,
    CREATE_MINT_SUCCESS as _CREATE_MINT_SUCCESS,
    FETCH_ITEMS_SUCCESS as _FETCH_ITEMS_SUCCESS,
    CREATE_ITEM_SUCCESS as _CREATE_ITEM_SUCCESS,
    CREATE_AIRDROP_SUCCESS as _CREATE_AIRDROP_SUCCESS,
    FETCH_USERS_SUCCESS as _FETCH_USERS_SUCCESS,
    CREATE_USER_SUCCESS as _CREATE_USER_SUCCESS,
    FETCH_USER_SUCCESS as _FETCH_USER_SUCCESS,
    REMOVE_USER_SUCCESS as _REMOVE_USER_SUCCESS,
    TOGGLE_SELECT_USER as _TOGGLE_SELECT_USER,
    UPDATED_USER_SUCCESS as _UPDATED_USER_SUCCESS,
} from '../types';
import { asyncEnsureRpcConnection } from '../../utils';
import type { RootState } from '../store';
import { getSavedUsers, getSavedUserById, updateUser, saveUser, getSavedItems, saveItem } from '../../indexDb/api';
import { getValidWallets } from '../../indexDb/helpers';
import { generateWallet, decryptDbWallet } from '../../utils/encryption';

// User actions
const fetchUsers = (users: LocalUserStore[]) => {
    return {
        type: _FETCH_USERS_SUCCESS,
        payload: users,
    };
};

export const thunkCheckWalletSelections =
    (wallets: IndexDbWallet[]): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        console.debug(`Checking ${wallets?.length} wallet selections ...`);
        try {
            await checkWalletSelections(wallets);
            dispatch(fetchWallets(wallets));
        } catch (error) {
            console.error(`thunkFetchUsers: Failed: ${error}`);
        }
    };

export const thunkCheckUserSelections =
    (users: IndexDbUser[]): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        console.debug(`Checking ${users?.length} user selections ...`);
        try {
            await checkUserSelections(users);
            dispatch(fetchUsers(users));
        } catch (error) {
            console.error(`thunkFetchUsers: Failed: ${error}`);
        }
    };

export const thunkResetWalletSelections =
    (): ThunkAction<void, RootState, unknown, Action<string>> => async (dispatch) => {
        const wallets = await getSavedIndexDbWallets();
        const selectedWallets = wallets.filter((wallet) => wallet.isSelected);
        console.debug(`Resetting ${wallets?.length} wallet selections ...`);
        try {
            await resetWalletSelections(selectedWallets);
            dispatch(fetchWallets(selectedWallets));
        } catch (error) {
            console.error(`thunkFetchUsers: Failed: ${error}`);
        }
    };

export const thunkResetUserSelections =
    (): ThunkAction<void, RootState, unknown, Action<string>> => async (dispatch) => {
        const users = await getSavedUsers();
        const selectedUsers = users.filter((user) => user.isSelected);
        console.debug(`Resetting ${users?.length} user selections ...`);
        try {
            await resetUserSelections(selectedUsers);
            dispatch(fetchUsers(selectedUsers));
        } catch (error) {
            console.error(`thunkFetchUsers: Failed: ${error}`);
        }
    };

const fetchUser = (user: LocalUserStore) => {
    return {
        type: _FETCH_USER_SUCCESS,
        payload: user,
    };
};

export const thunkFetchUser =
    (id: string): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        console.debug(`Fetching user ... ${id}`);

        try {
            const currentUser = await getSavedUserById(id);
            if (!currentUser) return;

            console.debug(`Fetched user ${id}`);

            dispatch(fetchUser(currentUser));
        } catch (error) {
            console.error(`thunkFetchUsers: Failed: ${error}`);
            notify({
                message: 'Remote Database',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

export const thunkFetchUsers =
    (checkDups?: boolean): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        console.debug(`Fetching users ...`);
        try {
            const users = await getSavedUsers();
            console.debug(`Fetched ${users?.length} users.`);
            // console.table(users);

            // Clear user selections on multiple selections
            if (checkDups) await checkUserSelections(users);
            // Clear unselected user unencrypted wallets
            await checkUserUnselectedUnencryptedWallets(users);

            dispatch(fetchUsers(users));
        } catch (error) {
            console.error(`thunkFetchUsers: Failed: ${error}`);
            notify({
                message: 'Remote Database',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

export const checkWalletSelections = async (wallets: IndexDbWallet[]) => {
    const selectedWallets = wallets.filter((wallet) => wallet.isSelected);
    if (!selectedWallets) return;

    const numNetworks = Object.values(ChainNetworks).length;
    const isOdd = selectedWallets.length % 3 != 0;

    console.debug(`Number of selected wallets: ${selectedWallets.length}, is odd: ${isOdd}`);

    if (selectedWallets.length > numNetworks + 1 || isOdd) {
        console.warn(
            selectedWallets.length > numNetworks + 1
                ? `Only ${numNetworks + 1} Wallet can be selected, there are currently ${
                      selectedWallets.length
                  } selected wallets!`
                : isOdd ??
                      `Only multiples of 3 wallets can be selected, there are currently ${selectedWallets.length} selected wallets!`
        );
        await resetWalletSelections(selectedWallets);
    }
};

export const checkUnselectedUnencryptedWallets = async (wallets: IndexDbWallet[]) => {
    const unselectedWallets = wallets.filter((wallet) => !wallet.isSelected);
    if (!unselectedWallets) return;

    console.debug(`Number of unselected wallets: ${unselectedWallets.length}`);
    await resetUnSelectedWalletsEncryption(unselectedWallets);
};

export const resetWalletSelections = async (wallets: IndexDbWallet[]) => {
    if (!wallets || wallets.length < 1) return;
    // console.debug(`Before wallet selection resets: ${wallets}`);
    // console.table(wallets);

    const updatedWalletsPromises = wallets.map((_wallet) => {
        const reset = async () => {
            if (_wallet.isSelected) {
                const _updatedWallet = {
                    ..._wallet,
                    isSelected: false,
                } as IndexDbWallet;

                const result = await updateIndexDbWallet(_updatedWallet)
                    .then((wallet) => wallet)
                    .catch((err) => {
                        console.error(err);
                    });

                console.debug(
                    `deselected ${_wallet.chain} ${_wallet.label} wallet '${_wallet.pubKey}' (${
                        _wallet.isSelected
                    } -> ${_updatedWallet.isSelected}) result: ${result ? 'succeded' : 'failed'}`
                );
                return result ? _updatedWallet : _wallet;
            }
            console.debug(`skipping unselected wallet '${_wallet.pubKey}'`);
            return _wallet;
        };
        return reset();
    });
    const updatedWallets = await Promise.all(updatedWalletsPromises);
    console.info(`Wallet selection resets: ${updatedWallets.length}`);
};

export const resetUnSelectedWalletsEncryption = async (wallets: IndexDbWallet[]) => {
    if (!wallets || wallets.length < 1) return;
    // console.debug(`Before wallet encryption resets: ${wallets.map(w=>w.pubKey)}`);
    // console.table(wallets);

    let numUpdatedWallets = 0;
    const updatedWalletsPromises = wallets.map((_wallet) => {
        const reset = async () => {
            if (!_wallet) return _wallet;
            if (_wallet.isSelected) {
                console.debug(`skipping selected wallet '${_wallet.pubKey}'`);
                return _wallet;
            }

            if (_wallet.privKey || _wallet.seed || _wallet.seedPhrase) {
                const _updatedWallet = {
                    ..._wallet,
                    privKey: undefined,
                    seed: undefined,
                    seedPhrase: undefined,
                } as IndexDbWallet;

                const result = await updateIndexDbWallet(_updatedWallet)
                    .then((wallet) => wallet)
                    .catch((err) => {
                        console.error(err);
                    });

                console.debug(
                    `resetting ${_wallet.chain} ${_wallet.label} wallet '${_wallet.pubKey}' encryption: '
          (${_wallet.privKey?.valueOf()} -> ${_updatedWallet.privKey?.valueOf()})
          (${_wallet.seed?.valueOf()} -> ${_updatedWallet.seed?.valueOf()})
          (${_wallet.seedPhrase} -> ${_updatedWallet.seedPhrase})
          result: ${result ? 'succeded' : 'failed'}`
                );
                if (result) numUpdatedWallets += 1;
                return result ? _updatedWallet : _wallet;
            }
            // console.debug(`skipping encrypted wallet '${_wallet.pubKey}'`);
            return _wallet;
        };
        return reset();
    });
    const updatedWallets = await Promise.all(updatedWalletsPromises);
    console.info(`Wallet encryption resets: ${numUpdatedWallets}/${updatedWallets.length}`);
};

export const checkUserSelections = async (users: IndexDbUser[]) => {
    const selectedUsers = users.filter((user) => user.isSelected);
    if (!selectedUsers) return;

    console.debug(`number of selected users: ${selectedUsers.length}`);

    if (selectedUsers.length > 1) {
        console.warn(`Only 1 user can be selected, there are currently ${selectedUsers.length} selected users!`);
        await resetUserSelections(selectedUsers);
    }
};

export const checkUserUnselectedUnencryptedWallets = async (users: IndexDbUser[]) => {
    const unselectedUsers = users.filter((user) => !user.isSelected);
    if (!unselectedUsers) return;

    console.debug(`number of unselected users: ${unselectedUsers.length}`);
    await resetUserUnSelectedWalletsEncryption(unselectedUsers);
};

export const resetUserSelections = async (users: IndexDbUser[]) => {
    if (!users || users.length < 1) return;
    // console.debug(`Before user selection reset: ${users.length}`);
    // console.table(users);

    const updatedUsersPromises = users.map((_user) => {
        const reset = async () => {
            if (_user.isSelected) {
                const _updatedUser = {
                    ..._user,
                    isSelected: false,
                } as IndexDbUser;

                const result = await updateUser(_updatedUser)
                    .then((user) => user)
                    .catch((err) => {
                        console.error(err);
                    });

                console.debug(
                    `deselected user ${_user.email} (${_user.isSelected} -> ${_updatedUser.isSelected}) result: ${
                        result ? 'succeded' : 'failed or entry not found or unchanged'
                    }`
                );
                return result ? _updatedUser : _user;
            }
            console.debug(`skipping unselected user '${_user.email}'`);
            return _user;
        };
        return reset();
    });
    const updatedUsers = await Promise.all(updatedUsersPromises);
    console.info(`User selections reset: ${updatedUsers.map((u) => u.email)}`);
    // console.table(updatedUsers);
};

export const resetUserUnSelectedWalletsEncryption = async (users: IndexDbUser[]) => {
    if (!users || users.length < 1) return;
    // console.debug(`Before unselected user unencrypted wallets resets: ${users.length}`);
    // console.table(users);

    const updatedUsersPromises = users.map((_user) => {
        const reset = async () => {
            if (
                !_user.wallets ||
                _user.wallets.length < 1 ||
                _user.wallets.filter((w) => w?.privKey || w?.seed || w?.seedPhrase).length < 1
            )
                return _user;
            // console.debug(`Before unselected user ${_user.email} wallet encryption resets: ${_user.wallets}`);
            // console.table(_user.wallets);

            if (!_user.isSelected) {
                let numUpdatedWallets = 0;
                const updatedWallets = _user.wallets.map((w) => {
                    if (!w) return w;
                    if (w.privKey || w.seed || w.seedPhrase) {
                        console.debug(
                            `resetting(${_user.email}) ${w.chain} ${w.label} wallet '${w.pubKey}' encryption: '
              (${w.privKey?.valueOf()} -> ${w.privKey?.valueOf()})
              (${w.seed?.valueOf()} -> ${w.seed?.valueOf()})
              (${w.seedPhrase} -> ${w.seedPhrase})`
                        );
                        numUpdatedWallets += 1;
                        return {
                            ...w,
                            privKey: undefined,
                            seed: undefined,
                            seedPhrase: undefined,
                        };
                    }
                });
                const _updatedUser = {
                    ..._user,
                    wallets: updatedWallets,
                } as IndexDbUser;

                const result = await updateUser(_updatedUser)
                    .then((user) => user)
                    .catch((err) => {
                        console.error(err);
                    });

                console.debug(
                    `resetting user ${_user.email} wallets (${_user.wallets.length} -> ${numUpdatedWallets}) 
          result: ${result ? 'succeded' : 'failed or entry not found or unchanged'}`
                );
                return result ? _updatedUser : _user;
            }
            console.debug(`skipping selected user '${_user.email}'`);
            return _user;
        };
        return reset();
    });
    await Promise.all(updatedUsersPromises);
    //@NOTES for debugging:
    // const updatedUsers = await Promise.all(updatedUsersPromises);
    // console.info(`Unselected Users unencrypted wallets resets: ${updatedUsers.map(u => u.email)}`);
    // console.table(updatedUsers);
};

const createUserAction = (payload: LocalUserStore[]) => {
    const result = {
        type: _CREATE_USER_SUCCESS,
        payload,
    };
    return result;
};

export const thunkCreateUser =
    (user: ApiUser, wallets: LocalWalletStore[]): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        if (!user) return;
        console.info(`Creating database user: ${user.name} ...`);

        const { users } = getState() as { users: LocalUserStore[] };
        if (users.map((u) => u.id).includes(user.id)) {
            console.warn(`User ${user.name} already exists in the local database.`);
            return;
        }

        try {
            const IndexdbUser = await saveUser(
                { ...user, isSelected: true },
                wallets.map((w) => {
                    return { ...w, isSelected: true };
                })
            );
            console.debug(`thunkCreateUser: saved user '${IndexdbUser.email}' to the local database`);

            // users.push({...IndexdbUser});  //@TODO is this really neccesary?
            // console.debug(`Latest users: ${users.length}`);
            // console.table(users);

            dispatch(createUserAction(users));
        } catch (err) {
            console.error(`thunkCreateUser: Failed: ${err}`);
        }
    };

const removeUserAction = (payload: LocalUserStore[]) => {
    const result = {
        type: _REMOVE_USER_SUCCESS,
        payload,
    };
    return result;
};

export const thunkRemoveUser =
    (user: IndexDbUser): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        console.warn(`Removing user: ${user.email} ...`);
        try {
            const IndexdbUsers = await getSavedIndexDbUserMatches(user.email);
            if (!IndexdbUsers || IndexdbUsers.length < 1) {
                console.warn(`Found no users matching email ${user.email}`);
                return;
            }

            IndexdbUsers.forEach(async (u) => await removeIndexDbUser(u));

            const { users } = getState() as { users: LocalUserStore[] };
            console.debug(`users: ${users.length}`);
            // console.table(users);
            const updatedUsers: LocalUserStore[] = users.flatMap((usr) => (usr.email === user.email ? [] : usr));

            dispatch(removeUserAction(updatedUsers));
        } catch (err) {
            console.error(`thunkRemoveUser: Failed: ${err}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${err}`,
                type: 'error',
            });
        }
    };

// const fetchUserWalletAction = (payload: LocalUserStore[]) => {
//   const result = {
//     type: CREATE_USER_SUCCESS,
//     payload,
//   };
//   return result;
// };

// export const thunkFetchUserWallets = (
// user: User
// ): ThunkAction<void, RootState, unknown, Action<string>> =>
// async (dispatch, getState) => {
//   console.debug(`thunkCreateUser: getting user wallets: ${user.email} ...`);
//   try {
//     const { users } = getState() as { users: LocalUserStore[] };
//     console.debug('users: ');
//     console.table(users);

//     const selectedUsers = users.filter(user => user.isSelected);
//     if (!selectedUsers) return

//     console.debug(`number of selected users: ${selectedUsers.length}`)
//     if (selectedUsers.length > 1) {
//       console.error(`Only 1 user can be selected, there are currently ${selectedUsers.length} selected users!`);
//       return;
//     };

//     // const updatedUser: LocalUserStore[] = users.map((user: LocalUserStore) => {
//     //   return user;
//     // });

//     // updatedUser.push({
//     //   gid: result,
//     //   ...newUser,
//     //   isSelected: true,
//     // });
//     user.id
//     const userWallets = await getUserWallets(user.id)
//     console.debug(`user (${user.email}) wallets:`)
//     console.table(userWallets)
//     dispatch(fetchWallets(userWallets));
//   } catch (err) {
//     console.error(`thunkCreateUser: Failed: ${err}`);
//   };
// };

const updateUserAction = (payload: LocalUserStore) => {
    const result = {
        type: _UPDATED_USER_SUCCESS,
        payload,
    };
    return result;
};

export const selectUserAction = (gid: string) => {
    return {
        type: _TOGGLE_SELECT_USER,
        payload: gid,
    };
};

export const thunkUserSelection =
    (user: IndexDbUser, selection: boolean): ThunkAction<void, RootState, unknown, Action<string>> =>
    // async (dispatch, getState) => {
    async (dispatch) => {
        if (!user) return;

        console.debug(`thunUpdateWallet: updating user: ${user.email} ...`);
        if (!user.gid) return;

        try {
            console.debug('deselecting updatedUser ');
            const updatedUser = {
                ...user,
                gid: user.gid,
                isSelected: selection,
            } as IndexDbUser;
            if (!updatedUser.gid) return;

            const result = await updateUser(updatedUser);
            console.debug(
                `User(${user.email}) selection result: ${
                    result ? 'succeded' : 'failed or entry not found or unchanged'
                }`
            );

            dispatch(selectUserAction(updatedUser.gid));
            return result;
        } catch (err) {
            console.error(`thunkUserSelection: Failed: ${err}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${err}`,
                type: 'error',
            });
        }
    };

export const thunkUpdateUser =
    (user: IndexDbUser): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        if (!user) return;

        console.debug(`thunUpdateWallet: updating user: ${user.email} ...`);
        if (!user.gid) return;

        try {
            const result = await updateUser(user);
            console.debug(
                `User(${user.email}) update result: ${result ? 'succeded' : 'failed or entry not found or unchanged'}`
            );

            dispatch(updateUserAction(user));
            return result;
        } catch (err) {
            console.error(`thunkUpdateUser: Failed: ${err}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${err}`,
                type: 'error',
            });
        }
    };

// Wallet actions
// const fetchAccountBalance = async (keypair: Keypair) => {
//   const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
//   // use getBalance method instead
//   const account = await connection?.getAccountInfo(keypair.publicKey);
//   return account ? account.lamports / LAMPORTS_PER_SOL : 0;
// };

const createWalletAction = (payload: LocalWalletStore) => {
    const result = {
        type: _CREATE_WALLET_SUCCESS,
        payload,
    };
    return result;
};

export const thunkCreateWallet =
    (password: string, label: string, chain: Chain): ThunkAction<void, RootState, unknown, Action<string>> =>
    // async (dispatch, getState) => {
    async (dispatch) => {
        if (!password || !label || !chain) return;
        console.info(`Creating ${chain} wallet: ${label} ...`);

        // const { wallets } = getState() as { wallets: LocalWalletStore[] };
        try {
            // Generated a new wallet
            const newWallet = await generateWallet(label, chain, password);
            if (!newWallet) return;

            // Save the wallet
            const IndexdbWallet = await saveIndexDbWallet({ ...newWallet, isSelected: true });
            console.debug(
                `thunkCreateWallet: saved wallet '${IndexdbWallet.chain}' '${IndexdbWallet.label}' '${IndexdbWallet.pubKey}' to the local database`
            );

            // wallets.push({...IndexdbWallet}); //@TODO is this really neccesary?
            // console.debug(`Latest wallets: ${wallets.length}`);
            // console.table(wallets);

            dispatch(createWalletAction(IndexdbWallet));
        } catch (err) {
            console.error(`thunkCreateWallet: Failed: ${err}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${err}`,
                type: 'error',
            });
        }
    };

const restoreWalletAction = (payload: LocalWalletStore) => {
    const result = {
        type: _RESTORE_WALLET_SUCCESS,
        payload,
    };
    return result;
};

export const thunkRestoreWallet =
    (wallet: IndexDbWallet, password: string): ThunkAction<void, RootState, unknown, Action<string>> =>
    // async (dispatch, getState) => {
    async (dispatch) => {
        if (!password || !wallet) return;
        console.info(`Restoring ${wallet.chain} wallet: ${wallet.label} ${wallet.pubKey} ...`);
        console.info(`Restoring with password '${password}'`);

        try {
            // Save the wallet
            const decryptedWallet = await decryptDbWallet(wallet, password);
            if (!decryptedWallet) {
                throw new Error(`Failed to decrypt wallet ${wallet.chain} wallet: ${wallet.label} ${wallet.pubKey}`);
            }

            const IndexdbWallet = await saveIndexDbWallet(decryptedWallet);
            console.debug(
                `thunkRestoreWallet: saved wallet '${IndexdbWallet.chain}' '${IndexdbWallet.label}' '${IndexdbWallet.pubKey}' to the local database`
            );

            // wallets.push({...IndexdbWallet}); //@TODO is this really neccesary?
            // console.debug(`Latest wallets: ${wallets.length}`);
            // console.table(wallets);

            dispatch(restoreWalletAction(IndexdbWallet));
        } catch (err) {
            console.error(`thunkRestoreWallet: Failed: ${err}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${err}`,
                type: 'error',
            });
        }
    };

// export const thunkImportWallet = (
//     password: string,
//     label: string,
//     seed: Uint8Array,
//     seedPhrase: string,
//     chain: Chain,
//     encodedPrivateKey: string,
//     // decodedPrivateKey: string,
//     publicKey: string,
//  ): ThunkAction<void, RootState, unknown, Action<string>> =>
//   async (dispatch, getState) => {
//     if (!label || !encodedPrivateKey || !seed) return;
//     console.info(`Importing wallet (${label}): ${publicKey} ...`);

//     const { wallets } = getState() as { wallets: LocalWalletStore[] };
//     try {
//       const keypairFromSecretKey = getKeyPairFromPrivateKey(
//         chain,
//         encodedPrivateKey,
//       );

//       const keypairFromSeed = getKeyPairFromSeedPhrase(chain, seedPhrase);
//       if (!keypairFromSeed || !keypairFromSecretKey || !publicKey) return;

//       const privKeys = [
//         keypairFromSecretKey.publicKey,
//         keypairFromSeed.publicKey,
//         publicKey,
//       ];

//       const allEqual = (keys: string[]) => keys.every(item => item === keys[0]);
//       if (!allEqual(privKeys) || privKeys.includes('')) {
//         console.debug(`Secret keys ${privKeys} do not match!`);
//         return;
//       }
//       const keypair = keypairFromSecretKey;
//       console.debug(`Wallet Import: keypair: ${keypair.publicKey}`);
//       const encryptedSeedPhrase = await encryptText(seedPhrase, password);
//       const encryptedPrivateKey = await encryptText(encodedPrivateKey, password );

//       const importedWallet: LocalWalletStore = {
//         label,
//         seed: seed,
//         encryptedSeedPhrase: encryptedSeedPhrase,
//         chain: chain,
//         encryptedPrivKey: encryptedPrivateKey,
//         privKey: decodeBase58(keypair.privateKey ?? ""),
//         pubKey: keypair.publicKey,
//         balance: 0,
//         isSelected: true,
//       };
//       console.debug(`Adding to indexDB: ${importedWallet.pubKey}`);

//       if (wallets.map(u => u.pubKey).includes(importedWallet.pubKey)) {
//         console.warn(
//           `Wallet ${importedWallet.pubKey} already exists in the local database.`,
//         );
//         return;
//       }
//       const IndexdbWallet = await saveWallet(importedWallet);
//       if (!IndexdbWallet.gid) {
//         console.warn(`Imported wallet ${IndexdbWallet.label} has no gid!`);
//         return;
//       }

//       console.debug(`Adding IndexdbWallet to wallets: ${IndexdbWallet.pubKey}`);
//       // wallets.push({ ...IndexdbWallet }); //@TODO: Is this correct?
//       // console.table(wallets);
//       dispatch(createWalletAction(wallets)); // commenting this out inhibits the display of the user's navbar profile icon
//     } catch (err) {
//       console.error(`Failed to import wallet: ${err}`);
//       notify({
//         message: 'Transaction',
//         description: `Failed: ${err}`,
//         type: 'error',
//       });
//     }
//   };

export const thunkImportWallet =
    (wallet: IndexDbWallet): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        if (!wallet) return;
        console.info(`Importing wallet (${wallet.label}): ${wallet.pubKey} ...`);

        const { wallets } = getState() as { wallets: LocalWalletStore[] };
        try {
            // const keypairFromSecretKey = getKeyPairFromPrivateKey(
            //   chain,
            //   encodedPrivateKey,
            // );

            // const keypairFromSeed = getKeyPairFromSeedPhrase(chain, seedPhrase);
            // if (!keypairFromSeed || !keypairFromSecretKey || !publicKey) return;

            // const privKeys = [
            //   keypairFromSecretKey.publicKey,
            //   keypairFromSeed.publicKey,
            //   publicKey,
            // ];

            // const allEqual = (keys: string[]) => keys.every(item => item === keys[0]);
            // if (!allEqual(privKeys) || privKeys.includes('')) {
            //   console.debug(`Secret keys ${privKeys} do not match!`);
            //   return;
            // // }
            // const keypair = keypairFromSecretKey;
            // console.debug(`Wallet Import: keypair: ${keypair.publicKey}`);
            // const encryptedSeedPhrase = await encryptText(seedPhrase, password);
            // const encryptedPrivateKey = await encryptText(encodedPrivateKey, password );

            // const importedWallet: LocalWalletStore = {
            //   label,
            //   seed: seed,
            //   encryptedSeedPhrase: encryptedSeedPhrase,
            //   chain: chain,
            //   encryptedPrivKey: encryptedPrivateKey,
            //   privKey: decodeBase58(keypair.privateKey ?? ""),
            //   pubKey: keypair.publicKey,
            //   balance: 0,
            //   isSelected: true,
            // };
            console.debug(`Adding to indexDB: ${wallet.pubKey}`);

            if (wallets.map((u) => u.pubKey).includes(wallet.pubKey)) {
                console.warn(`Wallet ${wallet.pubKey} already exists in the local database.`);
                return;
            }
            const IndexdbWallet = await saveIndexDbWallet(wallet);
            if (!IndexdbWallet.gid) {
                console.warn(`Imported wallet ${IndexdbWallet.label} has no gid!`);
                return;
            }

            console.debug(`Adding IndexdbWallet to wallets: ${IndexdbWallet.pubKey}`);
            // wallets.push({ ...IndexdbWallet }); //@TODO: Is this correct?
            // console.table(wallets);
            dispatch(createWalletAction(IndexdbWallet));
        } catch (err) {
            console.error(`Failed to import wallet: ${err}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${err}`,
                type: 'error',
            });
        }
    };

export const thunkWalletSelection =
    (wallet: IndexDbWallet, selection: boolean): ThunkAction<void, RootState, unknown, Action<string>> =>
    // async (dispatch, getState) => {
    async (dispatch) => {
        if (!wallet) return;

        console.debug(`thunUpdateWallet: updating wallet: ${wallet.pubKey} ...`);
        if (!wallet.gid) {
            console.warn(`${wallet.chain} ${wallet.label} ${wallet.pubKey} gid not found!`);
            return;
        }

        try {
            const _updatedWallet = {
                ...wallet,
                gid: wallet.gid,
                isSelected: selection,
                seed: wallet.seed,
                seedPhrase: wallet.seedPhrase,
                privKey: wallet.privKey,
            } as IndexDbWallet;
            if (!_updatedWallet.gid) return;

            const result = await updateIndexDbWallet(_updatedWallet);
            console.debug(
                `Wallet(${wallet.pubKey}) selection result: ${
                    result ? 'succeded' : 'failed or entry not found or unchanged'
                }`
            );

            dispatch(selectWalletAction(_updatedWallet.gid));
            return result;
        } catch (err) {
            console.error(`thunkWalletSelection: Failed: ${err}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${err}`,
                type: 'error',
            });
        }
    };

const updateWalletAction = (payload: LocalWalletStore) => {
    const result = {
        type: _UPDATED_WALLET_SUCCESS,
        payload,
    };
    return result;
};

export const thunkUpdateWallet =
    (wallet: IndexDbWallet): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        if (!wallet) return;

        console.debug(`thunUpdateWallet: updating wallet: ${wallet.pubKey} ...`);
        if (!wallet.gid) {
            console.warn(`${wallet.chain} ${wallet.label} ${wallet.pubKey} gid not found!`);
            return;
        }

        try {
            const _updatedWallet = {
                ...wallet,
                gid: wallet.gid,
            } as IndexDbWallet;
            if (!_updatedWallet.gid) return;
            // console.debug('thunkUpdateWallet: _updatedWallet', _updatedWallet.gid);

            const result = await updateIndexDbWallet(_updatedWallet);
            console.debug(
                `Wallet(${wallet.pubKey}) update result: ${
                    result ? 'succeded' : 'failed or entry not found or unchanged'
                }`
            );

            dispatch(updateWalletAction(_updatedWallet));
            return result;
        } catch (err) {
            console.error(`thunkWalletSelection: Failed: ${err}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${err}`,
                type: 'error',
            });
        }
    };

const removeWalletAction = (payload: LocalWalletStore[]) => {
    const result = {
        type: _REMOVE_WALLET_SUCCESS,
        payload,
    };
    return result;
};

export const thunkRemoveWallet =
    (wallet: IndexDbWallet): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        console.warn(`Removing wallet: ${wallet.chain} ${wallet.label} ${wallet.pubKey}...`);
        try {
            const IndexdbWallets = await getSavedIndexDbWalletMatches(wallet.pubKey);
            if (!IndexdbWallets || IndexdbWallets.length < 1) {
                console.warn(`Found no wallets matching public key ${wallet.pubKey}`);
                return;
            }

            IndexdbWallets.forEach(async (w) => await removeIndexDbWallet(w));

            const { wallets } = getState() as { wallets: LocalWalletStore[] };
            console.debug(`wallets: ${wallets.length}`);
            // console.table(wallets);
            const updatedWallets: LocalWalletStore[] = wallets.flatMap((wlt) =>
                wlt.pubKey === wallet.pubKey ? [] : wlt
            );

            dispatch(removeWalletAction(updatedWallets));
        } catch (err) {
            console.error(`thunkRemoveWallet: Failed: ${err}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${err}`,
                type: 'error',
            });
        }
    };

export const fetchWallets = (wallets: LocalWalletStore[]) => {
    return {
        type: _FETCH_WALLETS_SUCCESS,
        payload: wallets,
    };
};

export const thunkFetchWallets =
    (checkDups?: boolean): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        console.debug(`Fetching wallets ...`);
        try {
            const wallets = await getSavedIndexDbWallets();
            console.debug(`Fetched ${wallets?.length} wallets.`);
            // console.table(wallets)

            // Reset wallets selections on multiple selections.
            if (checkDups) await checkWalletSelections(wallets);
            // Remove encryption from any unselected wallets
            await checkUnselectedUnencryptedWallets(wallets);

            dispatch(fetchWallets(getValidWallets(wallets)));
        } catch (error) {
            console.error(`Failed to fetch wallets: ${error}`);
            notify({
                message: 'Local Database',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

export const selectWalletAction = (gid: string) => {
    return {
        type: _TOGGLE_SELECT_WALLET,
        payload: gid,
    };
};

export const thunkAirdropToAccount =
    (gid: string): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        console.debug(`thunkAirdropToAccount: airdroping tokens ...`);
        try {
            const { wallets } = getState() as { wallets: LocalWalletStore[] };
            const [selectedWallet] = (wallets ? wallets.filter((wallet) => wallet.gid === gid) : null) as [ApiWallet];

            if (!selectedWallet.privKey) return;

            const { connection } = connectionManager();
            if (!connection) {
                throw new ConnectionError('Connection not established!');
            }
            const keypair = Keypair.fromSecretKey(selectedWallet.privKey);
            const airdropSignature = await (
                await asyncEnsureRpcConnection(connection)
            ).requestAirdrop(keypair.publicKey, LAMPORTS_PER_SOL);

            const latestBlockHash = await (await asyncEnsureRpcConnection(connection)).getLatestBlockhash();
            // const result = await (await asyncEnsureRpcConnection(connection)).confirmTransaction(airdropSignature);
            const result = await (
                await asyncEnsureRpcConnection(connection)
            ).confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: airdropSignature,
            });
            console.info(`airdropped: ${result}`);

            const account = await (await asyncEnsureRpcConnection(connection)).getAccountInfo(keypair.publicKey);

            const balance = account ? account.lamports / LAMPORTS_PER_SOL : 0;
            const _updatedWalletState = wallets.map((wallet) => {
                if (wallet.gid === gid) {
                    return {
                        ...wallet,
                        balance,
                    };
                }
                return wallet;
            }) as IndexDbWallet[];
            dispatch(airdropToAccount(_updatedWalletState));
        } catch (error) {
            console.error(`thunkAirdropToAccount: Failed: ${error}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

const airdropToAccount = (updatedWalletState: LocalWalletStore[]) => {
    return {
        type: _CREATE_AIRDROP_SUCCESS,
        payload: updatedWalletState,
    };
};

export const thunkCreateTransaction =
    (
        chain: Chain,
        label: string,
        keypair: LocalKeypairStore,
        toAddress: string,
        amount: string
    ): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        console.debug(`thunkCreateTransaction: creating transaction ...`);
        //@TODO network should derive from Env var like the rest.
        const balance = (await getBalance(getChainProp(chain).ticker, keypair)) || 0;

        if (parseFloat(amount) > balance) {
            notify({
                message: 'Transaction',
                description: `Insufficient balance, account requires: ◎ ${parseFloat(amount) - balance}`,
                type: 'error',
            });
            return null;
        }

        // @TODO: impliment chain specific ascii text const chainIcon = (◎)
        notify({
            message: `Sending: ${amount} ${chain}`,
            description: `To: ${toAddress}`,
            type: 'info',
        });

        let result: Send | null | undefined = null;
        try {
            result = await sendFundsTransaction(getChainProp(chain).ticker, keypair, toAddress, amount);
        } catch (err) {
            if (err instanceof Error) {
                console.error(err);
                notify({
                    message: `Transaction Failed!`,
                    description: `${err.message}`,
                    type: 'error',
                });
            } else {
                console.error(err);
            }
        }
        // @TODO create chain specific transaction links.
        // import { ExplorerLink } from '../components/ExplorerLink';
        if (result) {
            console.info(`Successfully sent ${amount} to ${toAddress}: ${result.txid}`);
            notify({
                message: `Signature: ${result.txid}`,
                description: `Fee: ${result.gas}`,
                // description: (
                //   <>
                //     {errors.map(err => (
                //       <div>{err}</div>
                //     ))}
                //     <ExplorerLink address={txid} type="transaction" />
                //   </>
                // ),
                type: 'success',
            });
        }
        console.debug(`thunkCreateTransaction: tx: '${result}'`);
        const { wallets } = getState() as { wallets: LocalWalletStore[] };
        const _updatedWallets = wallets.map((wallet) => {
            if (wallet.isSelected) {
                return {
                    ...wallet,
                    balance: wallet.balance - parseFloat(amount),
                };
            }
            return wallet;
        }) as IndexDbWallet[];

        dispatch(createTransaction(_updatedWallets));
        // try {
        // } catch (error) {
        //   console.error(`Failed: ${error}`);
        //   notify({
        //     message: 'Transaction',
        //     description: `Failed: ${error}`,
        //     type: 'error',
        //   });
        // };
    };

const createTransaction = (payload: LocalWalletStore[]) => {
    return {
        type: _CREATE_TRANSACTION_SUCCESS,
        payload,
    };
};

export const thunkMintNearNft =
    (
        chain: Chain,
        label: string,
        keypair: LocalKeypairStore,
        toAddress: string,
        quantity: string,
        props: MintNearNft
    ): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (/*dispatch, getState*/) => {
        console.debug(`thunkMintNearNft: minting NFT ...`);
        //@TODO network should derive from Env var like the rest.
        // const balance = await getBalance(chain, keypair);

        // if (parseFloat(quantity) > balance!) {
        //   notify({
        //     message: 'Transaction',
        //     description: `Insufficient balance, account requires: ◎ ${
        //       parseFloat(quantity) - balance!
        //     }`,
        //     type: 'error',
        //   });
        //   return null;
        // }
        console.debug('func: thunkMintNearNft', chain, label);
        console.dir(keypair);
        console.info(toAddress, quantity);
        console.dir(props);

        // @TODO: impliment chain specific ascii text const chainIcon = (◎)
        notify({
            message: `Minting ${quantity} ${chain} NFT(s)`,
            description: `${toAddress}`,
            type: 'info',
        });

        //@TODO move this switch to wallet's picker
        if (!keypair.privateKey) return;

        try {
            //@TODO type should be chain agnostic
            let result: FinalExecutionOutcome | undefined;
            if (chain === ChainNetworks.NEAR) {
                result = await mintNearNft({
                    privateKey: keypair.privateKey,
                    metadata: props.metadata,
                    receiverId: props.receiverId,
                    attachedDeposit: props.attachedDeposit,
                    perpetualRoyalties: props.perpetualRoyalties,
                });
                console.debug('thunkMintNearNft result');
                console.dir(result);

                // @TODO create chain specific transaction links.
                // import { ExplorerLink } from '../components/ExplorerLink';
                if (result) {
                    notify({
                        // message: `Signature: ${result.txid}`,
                        // description: `Fee: ${result.gas}`,
                        message: `Hash: ${result.transaction.hash}`,
                        description: `Fee: ${result.transaction.gas_burnt}`,
                        // description: (
                        //   <>
                        //     {errors.map(err => (
                        //       <div>{err}</div>
                        //     ))}
                        //     <ExplorerLink address={txid} type="transaction" />
                        //   </>
                        // ),
                        type: 'success',
                    });
                }

                console.debug(`thunkMintNearNft: tx: '${result}'`);
                // const { wallets } = getState() as { wallets: LocalWalletStore[] };
                // const _updatedWallets = wallets.map(wallet => {
                //   if (wallet.isSelected) {
                //     return {
                //       ...wallet,
                //       balance: wallet.balance - parseFloat(amount),
                //     };
                //   }
                //   return wallet;
                // }) as IndexDbWallet[];

                // dispatch(mintNft(_updatedWallets));
                // try {
                // } catch (error) {
                //   console.error(`Failed: ${error}`);
                //   notify({
                //     message: 'Transaction',
                //     description: `Failed: ${error}`,
                //     type: 'error',
                //   });
                // };
            }
        } catch (err) {
            console.error(err);
            notify({
                message: `Minting failed!`,
                description: `${err}`,
                type: 'error',
            });
        }
    };

// const mintNft = (payload: LocalWalletStore[]) => {
//   return {
//     type: MINT_NFT_SUCCESS,
//     payload,
//   };
// };

export const thunkFetchTransaction =
    (
        keypair: Keypair, // keypair: LocalKeypairStore,
        gid: string
    ): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        console.debug(`thunkFetchTransaction: fetching transactions ...`);
        try {
            const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

            const signatures = await connection?.getSignaturesForAddress(keypair.publicKey);
            const signatureArray = signatures.map((sig) => sig.signature);

            const transactions: LocalTransactionStore[] = [];
            for (let i = 0; i < signatureArray.length; i++) {
                const transaction = await connection?.getTransaction(signatureArray[i]);
                if (!transaction) {
                    throw new Error(`Transaction is null for signature: ${signatureArray[i]}`);
                }
                if (!transaction.meta) {
                    throw new Error(`Transaction meta is null for signature: ${signatureArray[i]}`);
                }
                const accountKeyIndex = transaction.transaction.message.accountKeys.findIndex((key) =>
                    new PublicKey(key).equals(keypair.publicKey)
                );

                const {
                    blockTime,
                    slot,
                    meta: { fee, postBalances, preBalances, postTokenBalances },
                } = transaction;
                const feePaid = accountKeyIndex === 0 ? fee : 0;
                const amount =
                    (postBalances[accountKeyIndex] - preBalances[accountKeyIndex] - feePaid) / LAMPORTS_PER_SOL;
                const newTransaction = {
                    blockTime,
                    fee,
                    slot,
                    amount,
                    isToken: postTokenBalances && postTokenBalances.length ? true : false,
                };
                transactions.push(newTransaction);
            }

            const { wallets } = getState() as { wallets: LocalWalletStore[] };
            const _updatedWallets = wallets.map((wallet) => {
                if (wallet.gid === gid) {
                    return {
                        ...wallet,
                        transactions,
                    };
                }
                return wallet;
            }) as IndexDbWallet[];
            dispatch(fetchTransaction(_updatedWallets));
        } catch (error) {
            console.error(`thunkFetchTransaction: Failed: ${error}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

const fetchTransaction = (payload: LocalWalletStore[]) => {
    return {
        type: _FETCH_TRANSACTION_SUCCESS,
        payload,
    };
};

export const thunkCreateAndSendMint =
    (toAddress: string): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        console.debug(`thunkCreateAndSendMint: sending mint ...`);
        try {
            const { wallets } = getState() as { wallets: LocalWalletStore[] };
            const [selectedWallet] = wallets.filter((wallet) => wallet.isSelected);
            if (!selectedWallet.privKey) return;

            const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
            const keypair = Keypair.fromSecretKey(selectedWallet.privKey);

            console.debug(`thunkCreateAndSendMint: using acct '${selectedWallet.pubKey}' to mint ...'`);
            const mint = await Token.createMint(connection, keypair, keypair.publicKey, null, 2, TOKEN_PROGRAM_ID);
            const mintInto = await mint.getMintInfo();
            console.debug(`thunkCreateAndSendMint: minted: ${mintInto.supply}`);

            // Get the token account of the fromWallet Solana address, if it does not exist, create it
            const fromTokenAccount = await mint.getOrCreateAssociatedAccountInfo(keypair.publicKey);
            console.debug(`thunkCreateAndSendMint: fromTokenAccount: ${fromTokenAccount.address}`);

            //get the token account of the toWallet Solana address, if it does not exist, create it
            const toTokenAccount = await mint.getOrCreateAssociatedAccountInfo(new PublicKey(toAddress));
            console.debug(`thunkCreateAndSendMint: toTokenAccount: ${toTokenAccount.address}`);

            // Minting 1 new token to the "fromTokenAccount" account we just returned/created
            await mint.mintTo(fromTokenAccount.address, keypair.publicKey, [], LAMPORTS_PER_SOL);

            // Add token transfer instructions to transaction
            const transaction = new SolanaTransaction().add(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    fromTokenAccount.address,
                    toTokenAccount.address,
                    keypair.publicKey,
                    [],
                    1
                )
            );
            console.debug('thunkCreateAndSendMint: mint tx:');
            // transaction.instructions.forEach(value =>
            //   console.debug(`${value.programId.toBase58()}: ${value.keys.forEach(
            //     v => `${v.pubkey}: ${v.isSigner}`
            //   )} ${value.keys.keys()}- ${value.data.buffer}`)
            // );
            for (const key in transaction.instructions.keys) {
                console.debug(`thunkCreateAndSendMint: tx key: ${key}`);
            }
            // console.dir(transaction.instructions);

            // Sign transaction, broadcast, and confirm
            const signature = await sendAndConfirmTransaction(connection, transaction, [keypair], {
                commitment: 'confirmed',
            });
            console.debug(`thunkCreateAndSendMint: mint sig: ${signature}`);

            // Persist in local DB
            const newMint = {
                walletId: new PublicKey(fromTokenAccount.mint).toBase58(),
                mint: new PublicKey(fromTokenAccount.mint).toBase58(),
                owner: new PublicKey(fromTokenAccount.owner).toBase58(),
                address: new PublicKey(fromTokenAccount.address).toBase58(),
            };
            console.debug(`thunkCreateAndSendMint: newMint(${newMint.owner}): ${newMint.address} - ${newMint.mint}`);

            if (!selectedWallet.gid) {
                throw new Error('Wallet gid missing');
            }
            await saveIndexDbMint(selectedWallet.gid, newMint);
            const _updatedWallets = wallets.map((wallet) => {
                if (wallet.isSelected) {
                    return {
                        ...wallet,
                        mintObject: mint,
                    };
                }
                return wallet;
            }) as IndexDbWallet[];
            dispatch(createMintAction(_updatedWallets));
        } catch (error) {
            console.error(`thunkCreateAndSendMint: Failed: ${error}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

const createMintAction = (wallets: LocalWalletStore[]) => {
    return {
        type: _CREATE_MINT_SUCCESS,
        payload: wallets,
    };
};

// NOT INVOKED
export const thunkFetchTokens =
    (): ThunkAction<void, RootState, unknown, Action<string>> => async (dispatch, getState) => {
        try {
            const { wallets } = getState() as { wallets: LocalWalletStore[] };
            const [selectedWallet] = wallets.filter((wallet) => wallet.isSelected);
            if (!selectedWallet.gid || !selectedWallet.privKey) return;

            const savedMints = await getSavedIndexDbMints(selectedWallet.gid);

            const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
            const keypair = Keypair.fromSecretKey(selectedWallet.privKey);
            //   const tokenList = [];
            //   for (let i = 0; i < savedMints.length; i++) {
            //     const ticker = await Token.getAssociatedTokenAddress(
            //       selectedWallet.keypair.publicKey,
            //       selectedWallet.keypair.publicKey,
            //       new PublicKey(savedMints[i].mint),
            //       new PublicKey(savedMints[i].owner)
            //     );
            //     tokenList.push(ticker);
            //     console.debug("TICKER", ticker);
            //   }
            if (!savedMints || savedMints.length === 0) {
                console.warn('Mints not found');
                return;
            }

            const mint = savedMints[0].mint;
            if (!mint) {
                console.error('Mint not found on the first element of savedMints');
                return;
            }

            const tokenSupply = await connection?.getTokenSupply(new PublicKey(mint));
            console.info(`tokenSupply: ${tokenSupply}`);

            const tokenAccounts = await connection?.getProgramAccounts(keypair.publicKey);
            console.info(`tokenAccounts: ${tokenAccounts}`);
        } catch (error) {
            console.error(`thunkFetchTokens: Failed: ${error}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

// NOT INVOKED
export const thunkSendTokens =
    (toAddress: string): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        try {
            const { wallets } = getState() as { wallets: LocalWalletStore[] };
            const [selectedWallet] = wallets.filter((wallet) => wallet.isSelected);
            if (!selectedWallet.privKey) return;

            const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
            const keypair = Keypair.fromSecretKey(selectedWallet.privKey);

            //   const mint = await new Token(
            //     connection,
            //     selectedWallet.keypair.publicKey,
            //     selectedWallet.keypair.publicKey,
            //     selectedWallet.keypair
            //   );
            //   const mint = selectedWallet.mintObject;
            //   // Get the token account of the fromWallet Solana address, if it does not exist, create it
            //   const fromTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
            //     selectedWallet.keypair.publicKey
            //   );
            //   console.debug("FROM", fromTokenAccount);

            //   //get the token account of the toWallet Solana address, if it does not exist, create it
            //   const toTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
            //     new PublicKey(toAddress)
            //   );
            //   const accountInfo = await connection?.getAccountInfo(
            //     new PublicKey(toAddress)
            //   );
            //   console.debug("TO", toTokenAccount);
            //   console.debug("TO2", accountInfo);

            // Add token transfer instructions to transaction
            const transaction = new SolanaTransaction().add(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    keypair.publicKey,
                    new PublicKey(toAddress),
                    keypair.publicKey,
                    [],
                    1
                )
            );
            // Sign transaction, broadcast, and confirm
            await sendAndConfirmTransaction(connection, transaction, [keypair], {
                commitment: 'confirmed',
            });
        } catch (error) {
            console.error(`thunkSendTokens: Failed: ${error}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

// Item actions
const fetchItems = (items: LocalItemStore[]) => {
    return {
        type: _FETCH_ITEMS_SUCCESS,
        payload: items,
    };
};

export const thunkFetchItems =
    (): // checkDups?: boolean,
    ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        console.debug(`Fetching items ...`);
        try {
            const items = await getSavedItems();
            console.debug(`Fetched ${items?.length} items.`);
            // console.table(items);

            let LocalItemStores: ApiItem[];
            if (items?.length) {
                // Generate keypair from seed
                LocalItemStores = [];

                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    LocalItemStores.push({ ...item });
                }
                dispatch(fetchItems(LocalItemStores));
            }
        } catch (error) {
            console.error(`thunkFetchItems: Failed: ${error}`);
        }
    };

export const thunkCreateItem =
    (item: ApiItem): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        console.debug(`thunkCreateItem: creating database item: ${item.title} ...`);
        try {
            const newItem = await saveItem(item);
            const { items } = getState() as { items: LocalItemStore[] };
            const _updatedItem: LocalItemStore[] = items.map((item: LocalItemStore) => {
                return item;
            }) as IndexDbItem[];
            _updatedItem.push({
                gid: newItem.gid,
                ...newItem,
            });
            dispatch(createItemAction(_updatedItem));
        } catch (err) {
            console.error(`thunkCreateItem: Failed: ${err}`);
        }
    };

const createItemAction = (payload: LocalItemStore[]) => {
    const result = {
        type: _CREATE_ITEM_SUCCESS,
        payload,
    };
    return result;
};
