import { type Action } from 'redux';
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
import { type ThunkAction } from 'redux-thunk';
import { type FinalExecutionOutcome } from 'near-api-js/lib/providers';

import { notify } from '@wallet-adapter/react';
import { ChainNetworks } from '../../chains';

import { type RootState } from '../index';
import { type MintNft as MintNearNft, mintNft as mintNearNft } from '../../networks/near';
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
    type LocalWallet,
    type LocalKeyPair,
    type LocalTransaction,
} from '@/store/types';
import type { ApiUser, ApiWallet } from '@/api';
import type { Send, SendNear, SendSolana } from '@/networks';
import {
    // encryptText,
    generateWallet,
    decryptDbWallet,
    // getKeyPairFromPrivateKey,
    // getKeyPairFromSeedPhrase,
    getValidWallets,
    getBalance,
    sendFundsTransaction,
    getChainProp,
} from '@/networks';
import {
    type DbWallet,
    getSavedUsers,
    // getSavedUser,
    saveUser,
    updateUser,
    updateWallet,
    // getUserProfiles,
    // saveProfile,
    // updateProfile,
    // getUserWallets,
    getSavedWalletMatches,
    getSavedWallets,
    saveWallet,
    removeWallet,
    getSavedMints,
    saveMint,
    getSavedUserById,
} from '../../indexDb';

export const thunkCheckWalletSelections =
    (wallets: DbWallet[]): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch) => {
        console.debug(`Checking ${wallets?.length} wallet selections ...`);
        try {
            await checkWalletSelections(wallets);
            dispatch(fetchWallets(wallets));
        } catch (error) {
            console.error(`thunkFetchUsers: Failed: ${error}`);
        }
    };

export const thunkResetWalletSelections =
    (): ThunkAction<void, RootState, unknown, Action<string>> => async (dispatch) => {
        const wallets = await getSavedWallets();
        const selectedWallets = wallets.filter((wallet) => wallet.isSelected);
        console.debug(`Resetting ${wallets?.length} wallet selections ...`);
        try {
            await resetWalletSelections(selectedWallets);
            dispatch(fetchWallets(selectedWallets));
        } catch (error) {
            console.error(`thunkFetchUsers: Failed: ${error}`);
        }
    };

export const checkWalletSelections = async (wallets: DbWallet[]) => {
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

export const checkUnselectedUnencryptedWallets = async (wallets: DbWallet[]) => {
    const unselectedWallets = wallets.filter((wallet) => !wallet.isSelected);
    if (!unselectedWallets) return;

    console.debug(`Number of unselected wallets: ${unselectedWallets.length}`);
    await resetUnSelectedWalletsEncryption(unselectedWallets);
};

export const resetWalletSelections = async (wallets: DbWallet[]) => {
    if (!wallets || wallets.length < 1) return;
    // console.debug(`Before wallet selection resets: ${wallets}`);
    // console.table(wallets);

    const updatedWalletsPromises = wallets.map((_wallet) => {
        const reset = async () => {
            if (_wallet.isSelected) {
                const _updatedWallet = {
                    ..._wallet,
                    isSelected: false,
                } as DbWallet;

                const result = await updateWallet(_updatedWallet)
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

export const resetUnSelectedWalletsEncryption = async (wallets: DbWallet[]) => {
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
                } as DbWallet;

                const result = await updateWallet(_updatedWallet)
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

// Wallet actions
// const fetchAccountBalance = async (keypair: Keypair) => {
//   const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
//   // use getBalance method instead
//   const account = await connection?.getAccountInfo(keypair.publicKey);
//   return account ? account.lamports / LAMPORTS_PER_SOL : 0;
// };

const createWalletAction = (payload: LocalWallet) => {
    const result = {
        type: _CREATE_WALLET_SUCCESS,
        payload,
    };
    return result;
};

export const thunkCreateWallet =
    (password: string, label: string, chain: string): ThunkAction<void, RootState, unknown, Action<string>> =>
    // async (dispatch, getState) => {
    async (dispatch) => {
        if (!password || !label || !chain) return;
        console.info(`Creating ${chain} wallet: ${label} ...`);

        // const { wallets } = getState() as { wallets: LocalWallet[] };
        try {
            // Generated a new wallet
            const newWallet = await generateWallet(label, chain, password);
            if (!newWallet) return;

            // Save the wallet
            const dbWallet = await saveWallet({ ...newWallet, isSelected: true });
            console.debug(
                `thunkCreateWallet: saved wallet '${dbWallet.chain}' '${dbWallet.label}' '${dbWallet.pubKey}' to the local database`
            );

            // wallets.push({...dbWallet}); //@TODO is this really neccesary?
            // console.debug(`Latest wallets: ${wallets.length}`);
            // console.table(wallets);

            dispatch(createWalletAction(dbWallet));
        } catch (err) {
            console.error(`thunkCreateWallet: Failed: ${err}`);
            notify({
                message: 'Transaction',
                description: `Failed: ${err}`,
                type: 'error',
            });
        }
    };

const restoreWalletAction = (payload: LocalWallet) => {
    const result = {
        type: _RESTORE_WALLET_SUCCESS,
        payload,
    };
    return result;
};

export const thunkRestoreWallet =
    (wallet: DbWallet, password: string): ThunkAction<void, RootState, unknown, Action<string>> =>
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

            const dbWallet = await saveWallet(decryptedWallet);
            console.debug(
                `thunkRestoreWallet: saved wallet '${dbWallet.chain}' '${dbWallet.label}' '${dbWallet.pubKey}' to the local database`
            );

            // wallets.push({...dbWallet}); //@TODO is this really neccesary?
            // console.debug(`Latest wallets: ${wallets.length}`);
            // console.table(wallets);

            dispatch(restoreWalletAction(dbWallet));
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
//     chain: string,
//     encodedPrivateKey: string,
//     // decodedPrivateKey: string,
//     publicKey: string,
//  ): ThunkAction<void, RootState, unknown, Action<string>> =>
//   async (dispatch, getState) => {
//     if (!label || !encodedPrivateKey || !seed) return;
//     console.info(`Importing wallet (${label}): ${publicKey} ...`);

//     const { wallets } = getState() as { wallets: LocalWallet[] };
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

//       const importedWallet: LocalWallet = {
//         label,
//         seed: seed,
//         encryptedSeedPhrase: encryptedSeedPhrase,
//         chain: chain,
//         encryptedPrivKey: encryptedPrivateKey,
//         privKey: decodeBs58(keypair.privateKey ?? ""),
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
//       const dbWallet = await saveWallet(importedWallet);
//       if (!dbWallet.gid) {
//         console.warn(`Imported wallet ${dbWallet.label} has no gid!`);
//         return;
//       }

//       console.debug(`Adding dbWallet to wallets: ${dbWallet.pubKey}`);
//       // wallets.push({ ...dbWallet }); //@TODO: Is this correct?
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
    (wallet: DbWallet): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        if (!wallet) return;
        console.info(`Importing wallet (${wallet.label}): ${wallet.pubKey} ...`);

        const { wallets } = getState() as { wallets: LocalWallet[] };
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

            // const importedWallet: LocalWallet = {
            //   label,
            //   seed: seed,
            //   encryptedSeedPhrase: encryptedSeedPhrase,
            //   chain: chain,
            //   encryptedPrivKey: encryptedPrivateKey,
            //   privKey: decodeBs58(keypair.privateKey ?? ""),
            //   pubKey: keypair.publicKey,
            //   balance: 0,
            //   isSelected: true,
            // };
            console.debug(`Adding to indexDB: ${wallet.pubKey}`);

            if (wallets.map((u) => u.pubKey).includes(wallet.pubKey)) {
                console.warn(`Wallet ${wallet.pubKey} already exists in the local database.`);
                return;
            }
            const dbWallet = await saveWallet(wallet);
            if (!dbWallet.gid) {
                console.warn(`Imported wallet ${dbWallet.label} has no gid!`);
                return;
            }

            console.debug(`Adding dbWallet to wallets: ${dbWallet.pubKey}`);
            // wallets.push({ ...dbWallet }); //@TODO: Is this correct?
            // console.table(wallets);
            dispatch(createWalletAction(dbWallet));
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
    (wallet: DbWallet, selection: boolean): ThunkAction<void, RootState, unknown, Action<string>> =>
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
            } as DbWallet;
            if (!_updatedWallet.gid) return;

            const result = await updateWallet(_updatedWallet);
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

const updateWalletAction = (payload: LocalWallet) => {
    const result = {
        type: _UPDATED_WALLET_SUCCESS,
        payload,
    };
    return result;
};

export const thunkUpdateWallet =
    (wallet: DbWallet): ThunkAction<void, RootState, unknown, Action<string>> =>
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
            } as DbWallet;
            if (!_updatedWallet.gid) return;
            // console.debug('thunkUpdateWallet: _updatedWallet', _updatedWallet.gid);

            const result = await updateWallet(_updatedWallet);
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

const removeWalletAction = (payload: LocalWallet[]) => {
    const result = {
        type: _REMOVE_WALLET_SUCCESS,
        payload,
    };
    return result;
};

export const thunkRemoveWallet =
    (wallet: DbWallet): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        console.warn(`Removing wallet: ${wallet.chain} ${wallet.label} ${wallet.pubKey}...`);
        try {
            const dbWallets = await getSavedWalletMatches(wallet.pubKey);
            if (!dbWallets || dbWallets.length < 1) {
                console.warn(`Found no wallets matching public key ${wallet.pubKey}`);
                return;
            }

            dbWallets.forEach(async (w) => await removeWallet(w));

            const { wallets } = getState() as { wallets: LocalWallet[] };
            console.debug(`wallets: ${wallets.length}`);
            // console.table(wallets);
            const updatedWallets: LocalWallet[] = wallets.flatMap((wlt) => (wlt.pubKey === wallet.pubKey ? [] : wlt));

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

export const fetchWallets = (wallets: LocalWallet[]) => {
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
            const wallets = await getSavedWallets();
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

export const thunkCreateTransaction =
    (
        chain: string,
        label: string,
        keypair: LocalKeyPair,
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
        const { wallets } = getState() as { wallets: LocalWallet[] };
        const _updatedWallets = wallets.map((wallet) => {
            if (wallet.isSelected) {
                return {
                    ...wallet,
                    balance: wallet.balance - parseFloat(amount),
                };
            }
            return wallet;
        }) as DbWallet[];

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

const createTransaction = (payload: LocalWallet[]) => {
    return {
        type: _CREATE_TRANSACTION_SUCCESS,
        payload,
    };
};

export const thunkMintNft =
    (
        chain: string,
        label: string,
        keypair: LocalKeyPair,
        toAddress: string,
        quantity: string,
        props: MintNearNft
    ): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (/*dispatch, getState*/) => {
        console.debug(`thunkMintNft: minting NFT ...`);
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
        console.debug('func: thunkMintNft', chain, label);
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
                console.debug('thunkMintNft result');
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

                console.debug(`thunkMintNft: tx: '${result}'`);
                // const { wallets } = getState() as { wallets: LocalWallet[] };
                // const _updatedWallets = wallets.map(wallet => {
                //   if (wallet.isSelected) {
                //     return {
                //       ...wallet,
                //       balance: wallet.balance - parseFloat(amount),
                //     };
                //   }
                //   return wallet;
                // }) as DbWallet[];

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

// const mintNft = (payload: LocalWallet[]) => {
//   return {
//     type: MINT_NFT_SUCCESS,
//     payload,
//   };
// };

export const thunkFetchTransaction =
    (
        keypair: Keypair, // keypair: LocalKeyPair,
        gid: string
    ): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch, getState) => {
        console.debug(`thunkFetchTransaction: fetching transactions ...`);
        try {
            const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

            const signatures = await connection?.getSignaturesForAddress(keypair.publicKey);
            const signatureArray = signatures.map((sig) => sig.signature);

            const transactions: LocalTransaction[] = [];
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

            const { wallets } = getState() as { wallets: LocalWallet[] };
            const _updatedWallets = wallets.map((wallet) => {
                if (wallet.gid === gid) {
                    return {
                        ...wallet,
                        transactions,
                    };
                }
                return wallet;
            }) as DbWallet[];
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

const fetchTransaction = (payload: LocalWallet[]) => {
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
            const { wallets } = getState() as { wallets: LocalWallet[] };
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
                mint: new PublicKey(fromTokenAccount.mint).toBase58(),
                owner: new PublicKey(fromTokenAccount.owner).toBase58(),
                address: new PublicKey(fromTokenAccount.address).toBase58(),
            };
            console.debug(`thunkCreateAndSendMint: newMint(${newMint.owner}): ${newMint.address} - ${newMint.mint}`);

            if (!selectedWallet.gid) {
                throw new Error('Wallet gid missing');
            }
            await saveMint(selectedWallet.gid, newMint);
            const _updatedWallets = wallets.map((wallet) => {
                if (wallet.isSelected) {
                    return {
                        ...wallet,
                        mintObject: mint,
                    };
                }
                return wallet;
            }) as DbWallet[];
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

const createMintAction = (wallets: LocalWallet[]) => {
    return {
        type: _CREATE_MINT_SUCCESS,
        payload: wallets,
    };
};

// NOT INVOKED
export const thunkFetchTokens =
    (): ThunkAction<void, RootState, unknown, Action<string>> => async (dispatch, getState) => {
        try {
            const { wallets } = getState() as { wallets: LocalWallet[] };
            const [selectedWallet] = wallets.filter((wallet) => wallet.isSelected);
            if (!selectedWallet.gid || !selectedWallet.privKey) return;

            const savedMints = await getSavedMints(selectedWallet.gid);

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
            const { wallets } = getState() as { wallets: LocalWallet[] };
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
