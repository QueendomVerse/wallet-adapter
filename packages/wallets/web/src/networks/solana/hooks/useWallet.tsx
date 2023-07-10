import type { Connection, PublicKey, Transaction, TransactionSignature } from '@solana/web3.js';
import { createContext, useContext } from 'react';

import type { Wallet } from '@mindblox-wallet-adapter/react';

import type { WebWalletAdapter } from '@/adapter';

import type {
    WalletName,
    SendTransactionOptions,
    SignerWalletAdapterProps,
    MessageSignerWalletAdapterProps,
} from '@mindblox-wallet-adapter/base';

export interface WalletContextState {
    adapter?: WebWalletAdapter | null;
    autoConnect: boolean;
    wallets: Wallet[];
    wallet: Wallet | null;
    publicKey: PublicKey | null;
    connecting: boolean;
    connected: boolean;
    disconnecting: boolean;

    setCredentials(chain: string, label: string, privateKey: Uint8Array): Promise<void>;
    select(walletName: WalletName): Promise<void>;
    connect(chain?: string, label?: string, privateKey?: Uint8Array): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction(
        transaction: Transaction,
        connection: Connection,
        options?: SendTransactionOptions
    ): Promise<TransactionSignature>;

    signTransaction: SignerWalletAdapterProps['signTransaction'] | undefined;
    signAllTransactions: SignerWalletAdapterProps['signAllTransactions'] | undefined;
    signMessage: MessageSignerWalletAdapterProps['signMessage'] | undefined;
}

const EMPTY_ARRAY: ReadonlyArray<never> = [];

const DEFAULT_CONTEXT = {
    autoConnect: false,
    connecting: false,
    connected: false,
    disconnecting: false,
    select(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _walletName: WalletName
    ) {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'select')));
    },
    connect(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _chain?: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _label?: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _privateKey?: Uint8Array
    ) {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'connect')));
    },
    disconnect() {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'disconnect')));
    },
    sendTransaction(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _transaction: Transaction,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _connection: Connection,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _options?: SendTransactionOptions
    ) {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'sendTransaction')));
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signTransaction(_transaction: Transaction) {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'signTransaction')));
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signAllTransactions(_transaction: Transaction[]) {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'signAllTransactions')));
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signMessage(_message: Uint8Array) {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'signMessage')));
    },
} as WalletContextState;
Object.defineProperty(DEFAULT_CONTEXT, 'wallets', {
    get() {
        console.error(constructMissingProviderErrorMessage('read', 'wallets'));
        return EMPTY_ARRAY;
    },
});
Object.defineProperty(DEFAULT_CONTEXT, 'wallet', {
    get() {
        console.error(constructMissingProviderErrorMessage('read', 'wallet'));
        return null;
    },
});
Object.defineProperty(DEFAULT_CONTEXT, 'publicKey', {
    get() {
        console.error(constructMissingProviderErrorMessage('read', 'publicKey'));
        return null;
    },
});

const constructMissingProviderErrorMessage = (action: string, valueName: string) => {
    return (
        'You have tried to ' +
        ` ${action} "${valueName}"` +
        ' on a WalletContext without providing one.' +
        ' Make sure to render a WalletProvider' +
        ' as an ancestor of the component that uses ' +
        'WalletContext'
    );
};

export const WalletContext = createContext<WalletContextState>(DEFAULT_CONTEXT as WalletContextState);

export const useWallet = (): WalletContextState => {
    // console.warn('func: useWallet')
    const wallet = useContext(WalletContext);
    // console.warn('useWallet', wallet.adapter?.name, wallet.publicKey?.toBase58(), wallet.connected)
    return wallet;
};
