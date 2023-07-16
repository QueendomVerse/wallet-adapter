import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { encode as encodeBase58, decode as decodeBase58 } from 'bs58';

import type {
    ChainKeypair,
    WalletName,
    Chain,
    LocalKeypairStore,
    LocalWalletStore,
} from '@mindblox-wallet-adapter/base';
import {
    getChainProp,
    WalletPrivateKeyError,
    WalletKeypairError,
    WalletActivationError,
    WalletError,
    WalletLoadError,
    capitalizeFirst,
    ChainNetworks,
} from '@mindblox-wallet-adapter/base';
import { getKeyPairFromPrivateKey, getBalance, getAdapterNetwork } from '@mindblox-wallet-adapter/networks';

import type { ExtendedWallet } from '../adapter';
import { WebWalletAdapter } from '../adapter';

import {
    useBalanceState,
    useSelectedWalletNameState,
    useTickerState,
    useWallet,
    useWalletAdapterConfig,
    useWalletConnectedState,
    useWalletState,
} from '../hooks';
import type { IndexDbWallet } from '../indexDb';
import { getSavedIndexDbUserById, getSavedIndexDbWallet } from '../indexDb';
import type { AppDispatch, SelectedWallet } from '../store';
import { thunkFetchUser } from '../store';
import { ApiClient } from '../api';

export enum Status {
    PENDING = 'pending',
    SUCCESS = 'success',
    ERROR = 'error',
    IDLE = 'idle',
}

const TIMEOUT_LIMIT = 2000;

export interface WalletProps {
    chain: Chain;
    label: string;
}

interface WalletInteraction {
    status: Status;
    message: string | null;
    error: string | null;
    wallet: WalletProps | undefined;
    keypair: ChainKeypair | undefined;
    setWallet: (wallet: WalletProps, userAccountId?: string) => Promise<void>;
    disconnectWallets: (currentWallet?: WalletName) => Promise<void>;
}

interface WalletConfig {
    apiUrl: string;
    accountId?: string;
}

export const useChangeWallet = ({ apiUrl, accountId }: WalletConfig): WalletInteraction => {
    const apiClient = new ApiClient({ apiUrl });

    const { setSelectedTicker } = useTickerState();

    const { setIsWalletConnected } = useWalletConnectedState();
    const { setBalance } = useBalanceState();
    const { selectedWallet, setSelectedWallet } = useWalletState();
    const { setSelectedWalletName } = useSelectedWalletNameState();
    const { adapterConfig } = useWalletAdapterConfig();

    const [status, setStatus] = useState(Status.IDLE);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [toWallet, setToWallet] = useState<WalletProps | undefined>();
    const [keypair, setKeypair] = useState<ChainKeypair | undefined>();

    const dispatch: AppDispatch = useDispatch();
    const { adapter, wallets, wallet, select, connect, disconnect, publicKey, connected } = useWallet();

    const _wallets = wallets as ExtendedWallet[];
    const activeWallet = wallet as ExtendedWallet;

    const display = useCallback(() => {
        if (!selectedWallet) return;
        console.info(`displaying selected wallet: ${selectedWallet.name}`);

        if ((adapter && selectedWallet?.name != adapter.name) || !activeWallet?.adapter?.connected) return;

        console.debug(
            `Selected Wallet(${activeWallet.adapter.name}): 
        | '${selectedWallet?.keypair.publicKey}' 
        | '${activeWallet.adapter.publicKey?.toBase58()}'
        | '${publicKey}'`
        );
        console.table(
            _wallets.map((w) => {
                return `${w?.adapter?.name}: ${w?.adapter?.connected} | ${w?.adapter?.connecting}`;
            })
        );
    }, [toWallet, activeWallet, _wallets, selectedWallet, connected, publicKey]);

    const fetchDbUser = useCallback(async (id: string) => {
        dispatch(thunkFetchUser(id));
        return await getSavedIndexDbUserById(id);
    }, []);

    const setActiveWallet = useCallback(
        async (userAccountId: string, chain: Chain, label: string) => {
            console.info(`WalletInteraction: setting wallet active: '${chain}' '${label}`);

            const dbUsr = await fetchDbUser(userAccountId);
            const apiUsr = await apiClient.user.findOneUserById(userAccountId);
            const usr = dbUsr ?? apiUsr; //@TODO account for db functions below

            if (!usr) {
                throw new WalletError('Failed to load user');
            }
            console.debug(`WalletInteraction: User '${usr.email} 'wallets: `);
            // console.table(usr.wallets)

            const currentWallet = usr.wallets?.find(
                (wlt) => wlt.label === label && wlt.chain === chain
            ) as IndexDbWallet;
            if (!currentWallet) {
                throw new WalletError(`Invalid chain network '${chain}'!`);
            }

            const primaryWallet = usr.wallets?.find(
                (wlt) => wlt.label === 'primary' && wlt.chain === ChainNetworks.SOL
            ) as IndexDbWallet;

            const accountWallet = await getSavedIndexDbWallet(usr.walletAddress);
            console.debug(`currentWallet: ${currentWallet?.chain} - ${currentWallet?.pubKey}`);
            console.debug(`primaryWallet: ${primaryWallet?.chain} - ${primaryWallet?.pubKey}`);
            console.debug(`accountWallet: ${accountWallet?.chain} - ${accountWallet?.pubKey}`);

            return currentWallet || accountWallet || primaryWallet;
        },
        [toWallet]
    );

    const handleWalletChange = useCallback(
        async (chain: Chain, label: string, userAccountId: string) => {
            console.debug(`WalletInteraction: updating ticker: '${chain}' '${label}'`);
            // throw new AppError('Testing Error');

            console.debug('handleWalletChange userAccountId', userAccountId);
            if (!userAccountId) {
                throw new WalletError('Unable to fetch user wallets wallet without setting userAccountId!');
            }

            const activeWallet = await setActiveWallet(userAccountId, chain, label);
            if (!activeWallet || !activeWallet.privKey) {
                throw new WalletPrivateKeyError(`Requested wallet(${chain}, ${label}) is not decrypted!`);
            }

            const keypairStore = getKeyPairFromPrivateKey(
                activeWallet?.chain,
                encodeBase58(Buffer.from(activeWallet.privKey))
            );
            if (!keypairStore) {
                throw new WalletKeypairError('Failed to get create keypair!');
            }
            setKeypair(keypairStore?.keypair);

            try {
                const balance = await getBalance(getChainProp(chain).ticker, keypairStore);
                setBalance(parseFloat(balance ? balance.toFixed(5) : (0).toFixed(5)));
            } catch (err) {
                throw new WalletActivationError(`Failed getting ${chain} balance: ${err}`);
            }

            // await handleWalletSetup(activeWallet, SolanaKeypair);
            await handleWalletSetup(activeWallet);
            return true;
        },
        [toWallet]
    );

    const handleWalletSetup = useCallback(
        async (decryptedWallet: IndexDbWallet) => {
            const walletName = `${capitalizeFirst(decryptedWallet.chain)}${capitalizeFirst(
                decryptedWallet.label
            )}WebWallet` as WalletName;
            console.debug('walletName', walletName);
            const walletExists = _wallets.map((w) => w?.adapter?.name).includes(walletName);
            const connectedAdapter = _wallets.find((w) => w?.adapter?.name == walletName)?.adapter?.connected;

            console.debug(`Web wallet (${walletName}) exists: ${walletExists}`);
            console.debug(`Web wallet (${walletName}) connected: ${connectedAdapter}`);

            if (!walletExists && adapterConfig.network) {
                console.debug(`Adding Web wallet ... '${walletName}'`);

                const _adapterChain = getChainProp(decryptedWallet.chain).ticker;
                const _adapterNetwork = getAdapterNetwork(_adapterChain, adapterConfig.network);
                const walletAdapter = new WebWalletAdapter({
                    name: walletName,
                    chain: _adapterChain,
                    network: _adapterNetwork,
                });

                _wallets.push({
                    adapter: walletAdapter,
                    readyState: walletAdapter.readyState,
                });
            }

            // await disconnectWallets(walletName);
            const sltWlt = await handleWalletSelection(walletName, decryptedWallet);
            if (!sltWlt) {
                throw new WalletError('Failed to set wallet selection!');
            }
            // setLocalSelectedWallet(sltWlt);
            setSelectedWallet(sltWlt);
        },
        [connected, _wallets]
    );

    const disconnectWallets = useCallback(
        async (currentWallet?: WalletName) => {
            console.table(_wallets.map((w) => `${w?.adapter?.name}: ${w?.adapter?.connected}`));
            if (!_wallets || _wallets?.length < 1) return;

            const connWallets = _wallets.filter((w) => w?.adapter?.connected);
            if (!connWallets || connWallets?.length < 1) return;

            Promise.all(
                connWallets.map(async (w: ExtendedWallet) => {
                    console.info(`disconnecting ... ${w?.adapter?.name}`);
                    currentWallet
                        ? currentWallet === w?.adapter?.name
                            ? w.adapter.disconnect()
                            : null
                        : w?.adapter?.disconnect();
                })
            );
            connected && (await disconnect());
        },
        [connected, _wallets]
    );

    const handleWalletSelection = useCallback(async (name: WalletName, decryptedWallet: LocalWalletStore) => {
        // if (!wallet) return;

        if (!decryptedWallet.privKey) return;

        console.info(`WalletInteraction: Selecting wallet: '${name}'`);
        await select(name);
        setSelectedWalletName(name);
        const selection = {
            name: name,
            wallet: { ...decryptedWallet } as IndexDbWallet,
            keypair: {
                chain: decryptedWallet.chain,
                publicKey: decryptedWallet.pubKey,
                privateKey: encodeBase58(decryptedWallet.privKey),
            } as LocalKeypairStore,
        } as SelectedWallet;
        return selection;
        // }, [wallet]);
    }, []);

    const handleWalletConnection = useCallback(
        async (sltWlt: SelectedWallet) => {
            if (!activeWallet) return;

            if (!sltWlt) {
                throw new WalletLoadError(`Wallet not loaded!`);
            }
            if (!sltWlt?.keypair.privateKey) {
                throw new WalletPrivateKeyError(`Private key not set for wallet: '${sltWlt.name}'`);
            }

            console.debug('SelectedWallet connect', sltWlt.wallet.chain, sltWlt.wallet.label);
            await connect(
                sltWlt.wallet.chain,
                sltWlt.wallet.label,
                decodeBase58(sltWlt.keypair.privateKey)
                //@ts-ignore
                // true,
                // sltWlt.name
            );
        },
        [activeWallet]
    );

    useEffect(() => {
        const init = async () => {
            if (!activeWallet) return;

            if (selectedWallet && selectedWallet.keypair.privateKey) {
                await handleWalletConnection(selectedWallet);
            }
        };
        init();
    }, [activeWallet, selectedWallet]);

    const initChange = (
        chain: Chain,
        label: string,
        userAccountId: string,
        timeout: number = TIMEOUT_LIMIT
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            // set a delay
            setTimeout(async () => {
                try {
                    const result = await handleWalletChange(chain, label, userAccountId);
                    result
                        ? resolve(`Successfully switched to the ${getChainProp(chain).fullName} ${label} wallet`)
                        : reject(`Failed switching to the ${getChainProp(chain).fullName} ${label} wallet`);
                } catch (error) {
                    reject(error instanceof Error ? error.message : `Unknown Error: ${error}`);
                }
            }, timeout);
        });
    };

    const setWallet = useCallback(
        async (wallet: WalletProps, userAccountId?: string) => {
            setStatus(Status.PENDING);
            setMessage(null);
            setError(null);
            setKeypair(undefined);
            setToWallet(wallet);

            const _userAccountId = userAccountId ?? accountId;
            if (!_userAccountId) {
                throw new WalletError('Unable to fetch user wallets wallet without setting accountId or userId!');
            }
            console.info(`Changing wallet to ${wallet.chain} ${wallet.label} for ${userAccountId} ...`);

            const chains = Object.values(ChainNetworks).map((t) => t.valueOf());
            if (!chains.includes(wallet.chain)) {
                throw new WalletLoadError(`Invalid chain network '${wallet.chain}'!`);
            }

            try {
                const response = await initChange(wallet.chain, wallet.label, _userAccountId);
                setStatus(Status.SUCCESS);
                setMessage(response);
                setToWallet(wallet);
                setIsWalletConnected(true);
                setSelectedTicker(getChainProp(wallet.chain).ticker);
            } catch (error) {
                setStatus(Status.ERROR);
                setError(error instanceof Error ? error.message : `Unknown Error: ${error}`);
                setIsWalletConnected(false);
            }
        },
        [initChange, toWallet, accountId]
    );

    return {
        status,
        message,
        error,
        wallet: toWallet,
        keypair,
        setWallet,
        disconnectWallets,
    };
};
