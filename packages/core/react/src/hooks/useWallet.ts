import type {
    MessageSignerWalletAdapterProps,
    SendTransactionOptions,
    SignerWalletAdapterProps,
    WalletName,
    ChainPublicKey,
    ChainTransaction,
    ChainConnection,
    ChainTransactionSignature,
    ChainSendOptions,
    ChainSigner,
    Wallet,
} from '@mindblox-wallet-adapter/base';
import { createContext, useContext } from 'react';

export interface WalletContextState<
    PublicKey extends ChainPublicKey,
    Transaction extends ChainTransaction,
    Connection extends ChainConnection,
    TransactionSignature extends ChainTransactionSignature
> {
    autoConnect: boolean;
    wallets: Wallet<PublicKey, Transaction, Connection, TransactionSignature>[];
    wallet: Wallet<PublicKey, Transaction, Connection, TransactionSignature> | null;
    publicKey: PublicKey | null;
    connecting: boolean;
    connected: boolean;
    disconnecting: boolean;

    select(walletName: WalletName): void;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction<Signer extends ChainSigner, SendOptions extends ChainSendOptions>(
        transaction: Transaction,
        connection: Connection,
        options?: SendTransactionOptions<Signer, SendOptions>
    ): Promise<TransactionSignature | undefined>;

    signTransaction: SignerWalletAdapterProps<Transaction>['signTransaction'] | undefined;
    signAllTransactions: SignerWalletAdapterProps<Transaction>['signAllTransactions'] | undefined;
    signMessage: MessageSignerWalletAdapterProps['signMessage'] | undefined;
}

const EMPTY_ARRAY: ReadonlyArray<never> = [];

const createWalletContext = <
    PublicKey extends ChainPublicKey,
    Transaction extends ChainTransaction,
    Connection extends ChainConnection,
    TransactionSignature extends ChainTransactionSignature
>() => {
    const DEFAULT_CONTEXT = {
        autoConnect: false,
        connecting: false,
        connected: false,
        disconnecting: false,
        select(_name: WalletName) {
            console.error(constructMissingProviderErrorMessage('get', 'select'));
        },
        connect() {
            return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'connect')));
        },
        disconnect() {
            return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'disconnect')));
        },
        sendTransaction<Signer extends ChainSigner, SendOptions extends ChainSendOptions>(
            _transaction: Transaction,
            _connection: Connection,
            _options?: SendTransactionOptions<Signer, SendOptions>
        ) {
            return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'sendTransaction')));
        },
        signTransaction(_transaction: Transaction) {
            return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'signTransaction')));
        },
        signAllTransactions(_transaction: Transaction[]) {
            return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'signAllTransactions')));
        },
        signMessage(_message: Uint8Array) {
            return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'signMessage')));
        },
    } as WalletContextState<PublicKey, Transaction, Connection, TransactionSignature>;

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

    return createContext<WalletContextState<PublicKey, Transaction, Connection, TransactionSignature>>(DEFAULT_CONTEXT);
};

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

export const WalletContext = createWalletContext();

export const useWallet = (): WalletContextState<
    ChainPublicKey,
    ChainTransaction,
    ChainConnection,
    ChainTransactionSignature
> => {
    if (!WalletContext) {
        throw new Error('Unable to use wallet');
    }
    return useContext(WalletContext);
};
