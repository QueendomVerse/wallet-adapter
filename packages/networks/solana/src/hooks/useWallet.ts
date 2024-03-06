import { createContext, useContext } from 'react';

import type {
    WalletName,
    SendTransactionOptions,
    SignerWalletAdapterProps,
    MessageSignerWalletAdapterProps,
    SolanaConnection,
    SolanaPublicKey,
    SolanaSendOptions,
    SolanaSigner,
    SolanaTransaction,
    SolanaTransactionSignature,
    Chain,
    Wallet,
} from '@mindblox-wallet-adapter/base';

import { ChainNetworks } from '@mindblox-wallet-adapter/base';
import type { PhantomWallet, PhantomWalletAdapter } from '@mindblox-wallet-adapter/phantom';
import type { SolanaAdapter } from '../providers';

export type BrowserWalletAdapaters = PhantomWalletAdapter;
export type BrowserWallets = PhantomWallet;

export interface SolanaWallet
    extends Wallet<
        SolanaPublicKey,
        SolanaTransaction,
        SolanaConnection,
        SolanaTransactionSignature
    > {}

export interface WalletContextState {
    chain: Chain | null;
    adapter?: SolanaAdapter | BrowserWalletAdapaters | null;
    autoConnect: boolean;
    wallets: (
        | SolanaWallet
        | BrowserWallets
    )[];
    wallet: SolanaWallet | null;
    publicKey: SolanaPublicKey | null;
    connecting: boolean;
    connected: boolean;
    disconnecting: boolean;

    setCredentials?(chain: Chain, label: string, privateKey: Uint8Array): Promise<void>;
    select(walletName: WalletName): Promise<void>;
    connect(chain?: Chain, label?: string, privateKey?: Uint8Array): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction(
        transaction: SolanaTransaction,
        connection: SolanaConnection,
        options?: SendTransactionOptions<SolanaSigner, SolanaSendOptions>
    ): Promise<SolanaTransactionSignature | undefined>;

    signTransaction: SignerWalletAdapterProps<SolanaTransaction>['signTransaction'] | undefined;
    signAllTransactions: SignerWalletAdapterProps<SolanaTransaction>['signAllTransactions'] | undefined;
    signMessage: MessageSignerWalletAdapterProps['signMessage'] | undefined;
}

const EMPTY_ARRAY: ReadonlyArray<never> = [];

const DEFAULT_CONTEXT = {
    chain: ChainNetworks.SOL,
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
        _transaction: SolanaTransaction,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _connection: SolanaConnection,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _options?: SendTransactionOptions<SolanaSigner, SolanaSendOptions>
    ) {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'sendTransaction')));
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signTransaction(_transaction: SolanaTransaction) {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'signTransaction')));
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signAllTransactions(_transaction: SolanaTransaction[]) {
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
