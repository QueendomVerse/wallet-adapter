import type { Action } from 'redux';
import {
    Keypair,
    Connection,
    Transaction as SolanaTransaction,
    sendAndConfirmTransaction,
    // SystemProgram,
    PublicKey,
    clusterApiUrl,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
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
    ChainKeypair,
} from '@mindblox-wallet-adapter/base';
import { getChainProp, ChainNetworks, WalletDatabaseError } from '@mindblox-wallet-adapter/base';
import type { Send, MintNearNft } from '@mindblox-wallet-adapter/networks';
import { mintNearNft } from '@mindblox-wallet-adapter/networks';
import { getBalance, sendFundsTransaction } from '@mindblox-wallet-adapter/networks';
import {
    connectionManager, ConnectionError, TOKEN_PROGRAM_ID, createSolanaTransferInstruction, createSolanaMint, solanaMintTo, getOrCreateAssociatedSolanaTokenAccount, getMintInfo
} from '@mindblox-wallet-adapter/solana';

import type { IndexDbAppDatabase, IndexDbItem } from '../../indexDb';
import {
    type IndexDbWallet,
    type IndexDbUser,
    // getSavedIndexDbUsers,
    // getSavedIndexDbUser,
    // saveIndexDbUser,
    // updateIndexDbUser,
    // updateIndexDbWallet,
    // getIndexDbUserProfiles,
    // getIndexDbUserWallets,
    // saveIndexDbProfile,
    // updateIndexDbProfile,
    // getSavedIndexDbWalletMatches,
    // getSavedIndexDbWallets,
    // saveIndexDbWallet,
    // removeIndexDbWallet,
    // getSavedIndexDbMints,
    // saveIndexDbMint,
    // getSavedIndexDbUserMatches,
    // removeIndexDbUser,
    // getSavedIndexDbUserById,
} from '../../indexDb';
import type {
    NotificationParams,
} from '../types';
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
// import { getSavedUsers, getSavedUserById, updateUser, saveUser, getSavedItems, saveItem } from '../../indexDb/api';
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
    ({wallets, indexDb, notification}: {wallets: IndexDbWallet[], indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        console.debug(`Checking ${wallets?.length} wallet selections ...`);
        try {
            await checkWalletSelections({wallets, indexDb, notification});
            dispatch(fetchWallets(wallets));
        } catch (error) {
            console.error(`thunkFetchUsers: Failed: ${error}`);
            notification && notification && notification({
                message: 'Wallet Selections',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

export const thunkCheckUserSelections =
    ({users, indexDb, notification} : {users: IndexDbUser[], indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        console.debug(`Checking ${users?.length} user selections ...`);
        try {
            await checkUserSelections({users, indexDb, notification});
            dispatch(fetchUsers(users));
        } catch (error) {
            console.error(`thunkFetchUsers: Failed: ${error}`);
            notification && notification && notification({
                message: 'User Selections',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

export const thunkResetWalletSelections =
    ({indexDb, notification} : {indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> => async (dispatch) => {
        console.debug('Resetting wallet selections ...');
        try {
            if (!indexDb) {
                throw new WalletDatabaseError('Unable to reset wallet selections: IndexDB is not initialized.')
            }

            const wallets = await indexDb.getSavedWallets();
            const selectedWallets = wallets.filter((wallet) => wallet.isSelected);
            console.debug(`Resetting ${wallets?.length} wallet selections ...`);

            await resetWalletSelections({wallets: selectedWallets, indexDb, notification});
            dispatch(fetchWallets(selectedWallets));
        } catch (error) {
            console.error(`thunkFetchUsers: Failed: ${error}`);
            notification && notification && notification({
                message: 'Wallet Selections',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

export const thunkResetUserSelections =
    ({indexDb, notification} : {indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> => async (dispatch) => {
        console.debug('Resetting user selections ...');
        try {
            if (!indexDb) {
                throw new WalletDatabaseError('Unable to reset user selections: IndexDB is not initialized.')
            }

            const users = await indexDb.getSavedUsers();
            const selectedUsers = users.filter((user) => user.isSelected);
            console.debug(`Resetting ${users?.length} user selections ...`);

            await resetUserSelections({users: selectedUsers, indexDb, notification});
            dispatch(fetchUsers(selectedUsers));
        } catch (error) {
            console.error(`thunkFetchUsers: Failed: ${error}`);
            notification && notification && notification({
                message: 'User Selections',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

const fetchUser = (user: LocalUserStore) => {
    return {
        type: _FETCH_USER_SUCCESS,
        payload: user,
    };
};

export const thunkFetchUser =
    ({id, indexDb, notification} : {id: string, indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        try {
            if (!id) {
                throw new WalletDatabaseError('Unable to fetch user without specifying an id');
            }
            console.debug(`Fetching user ... ${id}`);

            if (!indexDb) {
                throw new WalletDatabaseError(`Unable to fetch user ${id}: IndexDB is not initialized.`)
            }

            const currentUser = await indexDb.getSavedUserById(id);
            if (!currentUser) return;

            console.debug(`Fetched user ${id}`);

            dispatch(fetchUser(currentUser));
        } catch (error) {
            console.error(`thunkFetchUsers: Failed: ${error}`);
            notification && notification && notification({
                message: 'Remote Database',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

export const thunkFetchUsers =
    ({checkDups = false, indexDb, notification} : {checkDups?: boolean, indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        console.debug(`Fetching users ...`);
        try {
            if (!indexDb) {
                throw new WalletDatabaseError(`Unable to fetch users: IndexDB is not initialized.`)
            }

            const users = await indexDb.getSavedUsers();
            console.debug(`Fetched ${users?.length} users.`);
            // console.table(users);

            // Clear user selections on multiple selections
            if (checkDups) await checkUserSelections({users, indexDb, notification});
            // Clear unselected user unencrypted wallets
            await checkUserUnselectedUnencryptedWallets({users, indexDb, notification});

            dispatch(fetchUsers(users));
        } catch (error) {
            console.error(`thunkFetchUsers: Failed: ${error}`);
            notification && notification({
                message: 'Remote Database',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

export const checkWalletSelections = async ({wallets, indexDb, notification} : {wallets: IndexDbWallet[], indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}) => {
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
        await resetWalletSelections({wallets: selectedWallets, indexDb, notification});
    }
};

export const checkUnselectedUnencryptedWallets = async ({wallets, indexDb, notification} : {wallets: IndexDbWallet[], indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}) => {
    const unselectedWallets = wallets.filter((wallet) => !wallet.isSelected);
    if (!unselectedWallets) return;

    console.debug(`Number of unselected wallets: ${unselectedWallets.length}`);
    await resetUnSelectedWalletsEncryption({wallets: unselectedWallets, indexDb, notification});
};

export const resetWalletSelections = async ({wallets, indexDb, notification} : {wallets: IndexDbWallet[], indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}) => {
    if (wallets?.length < 1) return;
    console.debug(`Resetting ${wallets.length} wallets ...`);
    // console.debug(`Before wallet selection resets: ${wallets}`);
    // console.table(wallets);
    try {
        if (!indexDb) {
            throw new WalletDatabaseError(`Unable to reset ${wallets.length} wallet selections: IndexDB is not initialized.`)
        }

        const updatedWalletsPromises = wallets.map((_wallet) => {
            const reset = async () => {
                if (_wallet.isSelected) {
                    const _updatedWallet = {
                        ..._wallet,
                        isSelected: false,
                    } as IndexDbWallet;

                    const result = await indexDb.updateWallet(_updatedWallet)
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
    } catch (error) {
        console.error(`resetWalletSelections: Failed: ${error}`);
        notification && notification({
            message: 'Wallet Selection',
            description: `Failed: ${error}`,
            type: 'error',
        });
    }
};

export const resetUnSelectedWalletsEncryption = async ({wallets, indexDb, notification} : {wallets: IndexDbWallet[], indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}) => {
    if (wallets?.length < 1) return;
    console.debug(`Unselecting encryption on ${wallets.length} wallets...`);
    // console.debug(`Before wallet encryption resets: ${wallets.map(w=>w.pubKey)}`);
    // console.table(wallets);
    try {
        if (!indexDb) {
            throw new WalletDatabaseError(`Unable to unselect encryption on ${wallets.length} wallets: IndexDB is not initialized.`)
        }

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

                    const result = await indexDb.updateWallet(_updatedWallet)
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
    } catch (error) {
        console.error(`resetUnSelectedWalletsEncryption: Failed: ${error}`);
        notification && notification({
            message: 'Wallet Encryption',
            description: `Failed: ${error}`,
            type: 'error',
        });
    }
};

export const checkUserSelections = async ({users, indexDb, notification} : {users: IndexDbUser[], indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}) => {
    const selectedUsers = users.filter((user) => user.isSelected);
    if (!selectedUsers) return;

    console.debug(`number of selected users: ${selectedUsers.length}`);

    if (selectedUsers.length > 1) {
        console.warn(`Only 1 user can be selected, there are currently ${selectedUsers.length} selected users!`);
        await resetUserSelections({users: selectedUsers, indexDb, notification});
    }
};

export const checkUserUnselectedUnencryptedWallets = async ({users, indexDb, notification} : {users: IndexDbUser[], indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}) => {
    const unselectedUsers = users.filter((user) => !user.isSelected);
    if (!unselectedUsers) return;

    console.debug(`number of unselected users: ${unselectedUsers.length}`);
    await resetUserUnSelectedWalletsEncryption({users: unselectedUsers, indexDb, notification});
};

export const resetUserSelections = async ({users, indexDb, notification} : {users: IndexDbUser[], indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}) => {
    if (users?.length < 1) return;
    console.debug(`Resetting ${users.length} wallets ...`);
    // console.debug(`Before user selection reset: ${users.length}`);
    // console.table(users);
    try {
        if (!indexDb) {
            throw new WalletDatabaseError(`Unable to reset ${users.length} user selections: IndexDB is not initialized.`)
        }

        const updatedUsersPromises = users.map((_user) => {
            const reset = async () => {
                if (_user.isSelected) {
                    const _updatedUser = {
                        ..._user,
                        isSelected: false,
                    } as IndexDbUser;

                    const result = await indexDb.updateUser(_updatedUser)
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
    } catch (error) {
        console.error(`resetUserSelections: Failed: ${error}`);
        notification && notification({
            message: 'User Selections',
            description: `Failed: ${error}`,
            type: 'error',
        });
    }
};

export const resetUserUnSelectedWalletsEncryption = async ({users, indexDb, notification} : {users: IndexDbUser[], indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}) => {
    if (users?.length < 1) return;
    console.debug(`Resetting Unselecting wallet encryption for ${users.length} users...`);
    // console.debug(`Before unselected user unencrypted wallets resets: ${users.length}`);
    // console.table(users);
    try {
        if (!indexDb) {
            throw new WalletDatabaseError(`Unable to unselect wallet encryption for ${users.length} users: IndexDB is not initialized.`)
        }

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

                    const result = await indexDb.updateUser(_updatedUser)
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
    } catch (error) {
        console.error(`resetUserUnSelectedWalletsEncryption: Failed: ${error}`);
        notification && notification({
            message: 'Wallet Encryption',
            description: `Failed: ${error}`,
            type: 'error',
        });
    }
};

const createUserAction = (payload: LocalUserStore[]) => {
    const result = {
        type: _CREATE_USER_SUCCESS,
        payload,
    };
    return result;
};

export const thunkCreateUser =
    ({user, wallets, indexDb, notification} : {user: ApiUser, wallets: LocalWalletStore[], indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        try {
            if (!user?.id) {
                throw new WalletDatabaseError('Unable to create a user having an empty id');
            }
            console.info(`Creating database user[${user.id}]: ${user?.name} ...`);

            if (!indexDb) {
                throw new WalletDatabaseError(`Unable to create user[${user.id}]: ${user?.name} : IndexDB is not initialized.`);
            }

            const { users } = getState() as { users: LocalUserStore[] };
            if (users.map((u) => u.id).includes(user.id)) {
                console.warn(`User id ${user.id}(${user?.name}) already exists in the local database.`);
                return;
            }

            const IndexdbUser = await indexDb.saveUser(
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
        } catch (error) {
            console.error(`thunkCreateUser: Failed: ${error}`);
            notification && notification({
                message: 'User Creation',
                description: `Failed: ${error}`,
                type: 'error',
            });
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
    ({user, indexDb, notification} : {user: IndexDbUser, indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        try {
            if (!user?.email) {
                throw new WalletDatabaseError('Unable to remove user having no email')
            }
            console.warn(`Removing user: ${user.email} ...`);

            if (!indexDb) {
                throw new WalletDatabaseError(`Unable to remove user ${user.email}: IndexDB is not initialized.`)
            }

            const IndexdbUsers = await indexDb.getSavedUserMatches(user.email);
            if (!IndexdbUsers || IndexdbUsers.length < 1) {
                console.warn(`Found no users matching email ${user.email}`);
                return;
            }

            IndexdbUsers.forEach(async (u) => await indexDb.removeUser(u));

            const { users } = getState() as { users: LocalUserStore[] };
            console.debug(`users: ${users.length}`);
            // console.table(users);
            const updatedUsers: LocalUserStore[] = users.flatMap((usr) => (usr.email === user.email ? [] : usr));

            dispatch(removeUserAction(updatedUsers));
        } catch (err) {
            console.error(`thunkRemoveUser: Failed: ${err}`);
            notification && notification({
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
    ({user, selection, indexDb, notification} : {user: IndexDbUser, selection: boolean, indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    // async (dispatch, getState) => {
    async (dispatch) => {
        try {
            if (!user?.gid || selection === undefined) {
                throw new WalletDatabaseError('Unable to remove user having no gid or if selection is undefined')
            }
            console.warn(`Setting selection as ${selection} for user[${user.gid}]: ${user?.email} ...`);

            if (!indexDb) {
                throw new WalletDatabaseError(`Unable to selection for user[${user.id}] ${user?.email}: IndexDB is not initialized.`)
            }

            console.debug(`thunkUserSelection: updating user: ${user?.email} ...`);
            const updatedUser = {
                ...user,
                gid: user.gid,
                isSelected: selection,
            } as IndexDbUser;
            if (!updatedUser.gid) return;

            const result = await indexDb.updateUser(updatedUser);
            console.debug(
                `User(${user.email}) selection result: ${
                    result ? 'succeded' : 'failed or entry not found or unchanged'
                }`
            );

            dispatch(selectUserAction(updatedUser.gid));
            return result;
        } catch (err) {
            console.error(`thunkUserSelection: Failed: ${err}`);
            notification && notification({
                message: 'Transaction',
                description: `Failed: ${err}`,
                type: 'error',
            });
        }
    };

export const thunkUpdateUser =
    ({user, indexDb, notification} : {user: IndexDbUser, indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        try {
            if (!user?.gid) {
                throw new WalletDatabaseError('Unable to remove user having no gid')
            }
            console.warn(`Updating user[${user.gid}]: ${user?.email} ...`);

            if (!indexDb) {
                throw new WalletDatabaseError(`Unable to update user[${user.id}] ${user?.email}: IndexDB is not initialized.`)
            }

            console.debug(`thunUpdateWallet: updating user: ${user?.email} ...`);

            const result = await indexDb.updateUser(user);
            console.debug(
                `User(${user.email}) update result: ${result ? 'succeded' : 'failed or entry not found or unchanged'}`
            );

            dispatch(updateUserAction(user));
            return result;
        } catch (err) {
            console.error(`thunkUpdateUser: Failed: ${err}`);
            notification && notification({
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
    ({password, label, chain, indexDb, notification} : {password: string, label: string, chain: Chain, indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    // async (dispatch, getState) => {
    async (dispatch) => {
        try {
            if (!chain || !label || !password) {
                throw new WalletDatabaseError(`Unable to create wallet without specifying all of chain(${chain}) label(${chain}) and password(len: ${password?.length})`);
            }
            console.info(`Creating ${chain} ${label} wallet with a ${password?.length} password...`);
            // const { wallets } = getState() as { wallets: LocalWalletStore[] };

            if (!indexDb) {
                throw new WalletDatabaseError(`Unable to create ${chain} ${label}  wallet: IndexDB is not initialized.`)
            }

            // Generated a new wallet
            const newWallet = await generateWallet(label, chain, password);
            if (!newWallet) return;

            // Save the wallet
            const IndexdbWallet = await indexDb.saveWallet({ ...newWallet, isSelected: true });
            console.debug(
                `thunkCreateWallet: saved wallet '${IndexdbWallet.chain}' '${IndexdbWallet.label}' '${IndexdbWallet.pubKey}' to the local database`
            );

            // wallets.push({...IndexdbWallet}); //@TODO is this really neccesary?
            // console.debug(`Latest wallets: ${wallets.length}`);
            // console.table(wallets);

            dispatch(createWalletAction(IndexdbWallet));
        } catch (err) {
            console.error(`thunkCreateWallet: Failed: ${err}`);
            notification && notification({
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
    ({wallet, password, indexDb, notification} : {wallet: IndexDbWallet, password: string, indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    // async (dispatch, getState) => {
    async (dispatch) => {
        try {
            if (!password || !wallet?.chain || !wallet?.label || !wallet?.pubKey) {
                throw new WalletDatabaseError(`Unable to restore wallet without specifying all of chain(${wallet?.chain}) label(${wallet?.chain}) public key(${wallet?.pubKey}) and password(len: ${password?.length})`);
            }
            console.debug(`Restoring ${wallet.chain} wallet: ${wallet.label} ${wallet.pubKey} ...`);
            // console.debug(`Restoring with password '${password}'`);

            if (!indexDb) {
                throw new WalletDatabaseError(`Unable to restore ${wallet.chain} ${wallet.label} wallet with public key ${wallet.pubKey}: IndexDB is not initialized.`)
            }
            
            // Save the wallet
            const decryptedWallet = await decryptDbWallet({wallet, password, indexDb, notification});
            if (!decryptedWallet) {
                throw new Error(`Failed to decrypt wallet ${wallet.chain} wallet: ${wallet.label} ${wallet.pubKey}`);
            }

            const IndexdbWallet = await indexDb.saveWallet(decryptedWallet);
            console.debug(
                `thunkRestoreWallet: saved wallet '${IndexdbWallet.chain}' '${IndexdbWallet.label}' '${IndexdbWallet.pubKey}' to the local database`
            );

            // wallets.push({...IndexdbWallet}); //@TODO is this really neccesary?
            // console.debug(`Latest wallets: ${wallets.length}`);
            // console.table(wallets);

            dispatch(restoreWalletAction(IndexdbWallet));
        } catch (err) {
            console.error(`thunkRestoreWallet: Failed: ${err}`);
            notification && notification({
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
//       notification && notification({
//         message: 'Transaction',
//         description: `Failed: ${err}`,
//         type: 'error',
//       });
//     }
//   };

export const thunkImportWallet =
    ({wallet, indexDb, notification} : {wallet: IndexDbWallet, indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        try {
            if (!wallet?.chain || !wallet?.label || !wallet?.pubKey) {
                throw new WalletDatabaseError(`Unable to import wallet without specifying all of chain(${wallet?.chain}) label(${wallet?.chain}))`);
            }
            console.info(`Importing wallet (${wallet.label}): ${wallet.pubKey} ...`);

            if (!indexDb) {
                throw new WalletDatabaseError(`Unable to import ${wallet.chain} ${wallet.label} wallet with public key ${wallet.pubKey}: IndexDB is not initialized.`)
            }

            const { wallets } = getState() as { wallets: LocalWalletStore[] };

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
            const IndexdbWallet = await indexDb.saveWallet(wallet);
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
            notification && notification({
                message: 'Transaction',
                description: `Failed: ${err}`,
                type: 'error',
            });
        }
    };

export const thunkWalletSelection =
    ({wallet, selection, indexDb, notification} : {wallet: IndexDbWallet, selection: boolean, indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    // async (dispatch, getState) => {
    async (dispatch) => {
        try {
            if (!wallet?.gid) {
                throw new WalletDatabaseError(`${wallet.chain} ${wallet.label} ${wallet.pubKey} gid not found!`);
            }

            if (!wallet?.chain || !wallet?.label || !wallet?.pubKey) {
                throw new WalletDatabaseError(`Unable to select wallet without specifying all of chain(${wallet?.chain}) label(${wallet?.chain}))`);
            }
            console.debug(`selecting ${wallet.chain} ${wallet.label} wallet: ${wallet.pubKey} ...`);

            if (!indexDb) {
                throw new WalletDatabaseError(`Unable to select ${wallet.chain} ${wallet.label} wallet with public key ${wallet.pubKey}: IndexDB is not initialized.`)
            }

            const _updatedWallet = {
                ...wallet,
                gid: wallet.gid,
                isSelected: selection,
                seed: wallet.seed,
                seedPhrase: wallet.seedPhrase,
                privKey: wallet.privKey,
            } as IndexDbWallet;
            if (!_updatedWallet.gid) return;

            const result = await indexDb.updateWallet(_updatedWallet);
            console.debug(
                `Wallet(${wallet.pubKey}) selection result: ${
                    result ? 'succeded' : 'failed or entry not found or unchanged'
                }`
            );

            dispatch(selectWalletAction(_updatedWallet.gid));
            return result;
        } catch (err) {
            console.error(`thunkWalletSelection: Failed: ${err}`);
            notification && notification({
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
    ({wallet, indexDb, notification} : {wallet: IndexDbWallet, indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        try {
            console.debug(`thunUpdateWallet: updating wallet: ${wallet.pubKey} ...`);
            if (!wallet.gid) {
                throw new WalletDatabaseError(`${wallet.chain} ${wallet.label} ${wallet.pubKey} gid not found!`);
            }

            if (!wallet?.chain || !wallet?.label || !wallet?.pubKey) {
                throw new WalletDatabaseError(`Unable to update wallet without specifying all of chain(${wallet?.chain}) label(${wallet?.chain}))`);
            }
            console.info(`updating ${wallet.chain} ${wallet.label} wallet: ${wallet.pubKey} ...`);

            if (!indexDb) {
                throw new WalletDatabaseError(`Unable to update ${wallet.chain} ${wallet.label} wallet with public key ${wallet.pubKey}: IndexDB is not initialized.`)
            }

            const _updatedWallet = {
                ...wallet,
                gid: wallet.gid,
            } as IndexDbWallet;
            if (!_updatedWallet.gid) return;
            // console.debug('thunkUpdateWallet: _updatedWallet', _updatedWallet.gid);

            const result = await indexDb.updateWallet(_updatedWallet);
            console.debug(
                `Wallet(${wallet.pubKey}) update result: ${
                    result ? 'succeded' : 'failed or entry not found or unchanged'
                }`
            );

            dispatch(updateWalletAction(_updatedWallet));
            return result;
        } catch (err) {
            console.error(`thunkWalletSelection: Failed: ${err}`);
            notification && notification({
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
    ({wallet, indexDb, notification} : {wallet: IndexDbWallet, indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        try {
            if (!indexDb) {
                throw new WalletDatabaseError(`Unable to remove ${wallet.chain} ${wallet.label} wallet with public key ${wallet.pubKey}: IndexDB is not initialized.`)
            }

            if (!wallet?.chain || !wallet?.label || !wallet?.pubKey) {
                throw new WalletDatabaseError(`Unable to remove wallet without specifying all of chain(${wallet?.chain}) label(${wallet?.chain}))`);
            }
            console.warn(`Removing wallet: ${wallet.chain} ${wallet.label} ${wallet.pubKey}...`);

            const IndexdbWallets = await indexDb.getSavedWalletMatches(wallet.pubKey);
            if (!IndexdbWallets || IndexdbWallets.length < 1) {
                console.warn(`Found no wallets matching public key ${wallet.pubKey}`);
                return;
            }

            IndexdbWallets.forEach(async (w) => await indexDb.removeWallet(w));

            const { wallets } = getState() as { wallets: LocalWalletStore[] };
            console.debug(`wallets: ${wallets.length}`);
            // console.table(wallets);
            const updatedWallets: LocalWalletStore[] = wallets.flatMap((wlt) =>
                wlt.pubKey === wallet.pubKey ? [] : wlt
            );

            dispatch(removeWalletAction(updatedWallets));
        } catch (err) {
            console.error(`thunkRemoveWallet: Failed: ${err}`);
            notification && notification({
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
    ({checkDups = false, indexDb, notification}: {checkDups?: boolean, indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        console.debug(`Fetching wallets ...`);
        try {
            if (!indexDb) {
                console.error(`Unable to fetch wallets: IndexDB is not initialized.`)
                return;
            }
            const wallets = await indexDb.getSavedWallets();
            console.debug(`Fetched ${wallets?.length} wallets.`);
            // console.table(wallets)

            // Reset wallets selections on multiple selections.
            if (checkDups) await checkWalletSelections({wallets, indexDb, notification});
            // Remove encryption from any unselected wallets
            await checkUnselectedUnencryptedWallets({wallets, indexDb, notification});

            dispatch(fetchWallets(getValidWallets(wallets)));
        } catch (error) {
            console.error(`Failed to fetch wallets: ${error}`);
            notification && notification({
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
    ({gid, notification} : {gid: string, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
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
            notification && notification({
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

export const thunkCreateTransaction = ({chain, label, keypair, toAddress, amount, notification} : {
    chain: Chain,
    label: string,
    keypair: LocalKeypairStore,
    toAddress: string,
    amount: string,
    notification?: (params: NotificationParams) => void
}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        console.debug(`thunkCreateTransaction: creating transaction ...`);
        //@TODO network should derive from Env var like the rest.
        const balance = (await getBalance(getChainProp(chain).ticker, keypair)) || 0;

        if (parseFloat(amount) > balance) {
            notification && notification({
                message: 'Transaction',
                description: `Insufficient balance, account requires: ◎ ${parseFloat(amount) - balance}`,
                type: 'error',
            });
            return null;
        }

        // @TODO: impliment chain specific ascii text const chainIcon = (◎)
        notification && notification({
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
                notification && notification({
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
            notification && notification({
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
        //   notification && notification({
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

export const thunkMintNearNft = ({chain, label, keypair, toAddress, quantity, props, notification} : {
    chain: Chain,
    label: string,
    keypair: LocalKeypairStore,
    toAddress: string,
    quantity: string,
    props: MintNearNft,
    notification?: (params: NotificationParams) => void
}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (/*dispatch, getState*/) => {
        console.debug(`thunkMintNearNft: minting NFT ...`);
        //@TODO network should derive from Env var like the rest.
        // const balance = await getBalance(chain, keypair);

        // if (parseFloat(quantity) > balance!) {
        //   notification && notification({
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
        notification && notification({
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
                    notification && notification({
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
                //   notification && notification({
                //     message: 'Transaction',
                //     description: `Failed: ${error}`,
                //     type: 'error',
                //   });
                // };
            }
        } catch (err) {
            console.error(err);
            notification && notification({
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

export const thunkFetchTransaction = ({keypair, gid, notification} : {
    keypair: ChainKeypair, // keypair: LocalKeypairStore,
    gid: string,
    notification?: (params: NotificationParams) => void
}): ThunkAction<void, RootState, unknown, Action<string>> =>
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
            notification && notification({
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

export const thunkCreateAndSendMint = ({
    toAddress, indexDb, notification
} : {toAddress: string, indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        try {
            if (!toAddress) {
                throw new WalletDatabaseError('unable to create and send mint without specifying a to address')
            }
            console.debug(`thunkCreateAndSendMint: sending mint to address ${toAddress}...`);

            if (!indexDb) {
                throw new WalletDatabaseError(`Unable to create and send mint to address ${toAddress}: IndexDB is not initialized.`)
            }

            const { wallets } = getState() as { wallets: LocalWalletStore[] };
            const [selectedWallet] = wallets.filter((wallet) => wallet.isSelected);
            if (!selectedWallet.privKey) return;

            const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
            const keypair = Keypair.fromSecretKey(selectedWallet.privKey);

            console.debug(`thunkCreateAndSendMint: using acct '${selectedWallet.pubKey}' to mint ...'`);
            const mint = await createSolanaMint(connection, keypair, keypair.publicKey, null, 2, keypair, {}, TOKEN_PROGRAM_ID);
            const mintInto = await getMintInfo(connection, mint);
            console.debug(`thunkCreateAndSendMint: minted: ${mintInto.amount}`);

            // Get the token account of the fromWallet Solana address, if it does not exist, create it
            const fromTokenAccount = await getOrCreateAssociatedSolanaTokenAccount(connection, keypair, mint, keypair.publicKey);
            console.debug(`thunkCreateAndSendMint: fromTokenAccount: ${fromTokenAccount.address}`);

            //get the token account of the toWallet Solana address, if it does not exist, create it
            const toTokenAccount = await getOrCreateAssociatedSolanaTokenAccount(connection, keypair, new PublicKey(toAddress), keypair.publicKey);
            console.debug(`thunkCreateAndSendMint: toTokenAccount: ${toTokenAccount.address}`);

            // Minting 1 new token to the "fromTokenAccount" account we just returned/created
            await solanaMintTo(connection, keypair, mint, keypair.publicKey, keypair.publicKey, 1, [], {}); //LAMPORTS_PER_SOL

            // Add token transfer instructions to transaction
            const transaction = new SolanaTransaction().add(
                createSolanaTransferInstruction(
                    fromTokenAccount.address,
                    toTokenAccount.address,
                    keypair.publicKey,
                    1,
                    [],
                    TOKEN_PROGRAM_ID
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
            await indexDb.saveMint(selectedWallet.gid, newMint);
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
            notification && notification({
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
export const thunkFetchTokens = ({
    indexDb, notification} : { indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void }
): ThunkAction<void, RootState, unknown, Action<string>> => async (dispatch, getState) => {
        console.debug('Fetching tokens ...')
        try {
            if (!indexDb) {
                throw new WalletDatabaseError('Unable to fetch tokens: IndexDB is not initialized.')
            }

            const { wallets } = getState() as { wallets: LocalWalletStore[] };
            const [selectedWallet] = wallets.filter((wallet) => wallet.isSelected);
            if (!selectedWallet.gid || !selectedWallet.privKey) return;

            const savedMints = await indexDb.getSavedMints(selectedWallet.gid);

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
            notification && notification({
                message: 'Transaction',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

// NOT INVOKED
export const thunkSendTokens = ({toAddress, notification} : {
    toAddress: string,
    notification?: (params: NotificationParams) => void
}): ThunkAction<void, RootState, unknown, Action<string>> =>
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
                createSolanaTransferInstruction(
                    keypair.publicKey,
                    new PublicKey(toAddress),
                    keypair.publicKey,
                    1,
                    [],
                    TOKEN_PROGRAM_ID,
                )
            );
            // Sign transaction, broadcast, and confirm
            await sendAndConfirmTransaction(connection, transaction, [keypair], {
                commitment: 'confirmed',
            });
        } catch (error) {
            console.error(`thunkSendTokens: Failed: ${error}`);
            notification && notification({
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
    ({indexDb, notification} : {indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): // checkDups?: boolean,
    ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        console.debug(`Fetching items ...`);
        try {
            if (!indexDb) {
                throw new WalletDatabaseError('Unable to fetch items: IndexDB is not initialized.')
            }

            const items = await indexDb.getSavedItems();
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
            notification && notification({
                message: 'Item',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

export const thunkCreateItem =
    ({item, indexDb, notification} : {item: ApiItem, indexDb: IndexDbAppDatabase, notification?: (params: NotificationParams) => void}): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        try {
            if (!item?.title) {
                throw new WalletDatabaseError(`Unable to create item having no title ${JSON.stringify(item)}`)
            }
            console.debug(`thunkCreateItem: creating database item: ${item.title} ...`);

            if (!indexDb) {
                throw new WalletDatabaseError(`Unable to create item ${item.title}: IndexDB is not initialized.`)
            }

            const newItem = await indexDb.saveItem(item);
            const { items } = getState() as { items: LocalItemStore[] };
            const _updatedItem: LocalItemStore[] = items.map((item: LocalItemStore) => {
                return item;
            }) as IndexDbItem[];
            _updatedItem.push({
                gid: newItem.gid,
                ...newItem,
            });
            dispatch(createItemAction(_updatedItem));
        } catch (error) {
            console.error(`thunkCreateItem: Failed: ${error}`);
            notification && notification({
                message: 'Item',
                description: `Failed: ${error}`,
                type: 'error',
            });
        }
    };

const createItemAction = (payload: LocalItemStore[]) => {
    const result = {
        type: _CREATE_ITEM_SUCCESS,
        payload,
    };
    return result;
};
