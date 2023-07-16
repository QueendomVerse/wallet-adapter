import EventEmitter from 'eventemitter3';
import type { ChainTicker } from './chains';
import type { WalletError as WalletChainError } from './errors';
import { WalletNotConnectedError } from './errors';
import { SolanaPublicKey } from './networks/solana';
import type {
    ChainConnection,
    ChainPublicKey,
    ChainSendOptions,
    ChainSigner,
    ChainTransaction,
    ChainTransactionSignature,
} from './types';
import { asyncEnsureRpcConnection } from './utils';

export { EventEmitter };

export interface WalletAdapterEvents<PublicKey extends ChainPublicKey, WalletError extends WalletChainError> {
    connect(publicKey: PublicKey): void;
    disconnect(): void;
    error(error: WalletError): void;
    readyStateChange(readyState: WalletReadyState): void;
}

export interface SendTransactionOptions<Signer, SendOptions> {
    signers?: Signer[];
    sendOptions?: SendOptions;
}

export interface WalletAdapterProps<
    PublicKey extends ChainPublicKey,
    Transaction extends ChainTransaction,
    Connection extends ChainConnection,
    TransactionSignature extends ChainTransactionSignature,
    Name extends string = string
> {
    name: WalletName<Name>;
    url: string;
    icon: string;
    readyState: WalletReadyState;
    publicKey: PublicKey | null;
    connecting: boolean;
    connected: boolean;

    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction<Signer extends ChainSigner, SendOptions extends ChainSendOptions>(
        transaction: Transaction,
        connection: Connection,
        options?: SendTransactionOptions<Signer, SendOptions>
    ): Promise<TransactionSignature | string | undefined>;
}

export enum WalletReadyState {
    /**
     * User-installable wallets can typically be detected by scanning for an API
     * that they've injected into the global context. If such an API is present,
     * we consider the wallet to have been installed.
     */
    Installed = 'Installed',
    NotDetected = 'NotDetected',
    /**
     * Loadable wallets are always available to you. Since you can load them at
     * any time, it's meaningless to say that they have been detected.
     */
    Loadable = 'Loadable',
    /**
     * If a wallet is not supported on a given platform (eg. server-rendering, or
     * mobile) then it will stay in the `Unsupported` state.
     */
    Unsupported = 'Unsupported',
}

export type WalletName<T extends string = string> = T & { __brand__: 'WalletName' };

export type WalletAdapter<
    PublicKey extends ChainPublicKey,
    Transaction extends ChainTransaction,
    Connection extends ChainConnection,
    TransactionSignature extends ChainTransactionSignature,
    Name extends string = string
> = WalletAdapterProps<PublicKey, Transaction, Connection, TransactionSignature, Name> &
    EventEmitter<WalletAdapterEvents<PublicKey, WalletChainError>>;

export abstract class BaseWalletAdapter<
        PublicKey extends ChainPublicKey,
        WalletError extends WalletChainError,
        Transaction extends ChainTransaction,
        Connection extends ChainConnection,
        TransactionSignature extends ChainTransactionSignature,
        Name extends string = string
    >
    extends EventEmitter<WalletAdapterEvents<PublicKey, WalletError>>
    implements WalletAdapter<PublicKey, Transaction, Connection, TransactionSignature, Name>
{
    abstract chain: ChainTicker | null;
    abstract name: WalletName<Name>;
    abstract url: string;
    abstract icon: string;
    abstract readyState: WalletReadyState;
    abstract publicKey: PublicKey | null;
    abstract connecting: boolean;

    get connected(): boolean {
        return !!this.publicKey;
    }

    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract sendTransaction<Signer extends ChainSigner, SendOptions extends ChainSendOptions>(
        transaction: ChainTransaction,
        connection: ChainConnection,
        options?: SendTransactionOptions<Signer, SendOptions>
    ): Promise<TransactionSignature | string | undefined>;

    protected prepareTransaction = async <Tx extends Transaction, Conn extends Connection>(
        transaction: Tx,
        connection: Conn
    ): Promise<Transaction> => {
        if (!this.publicKey) throw new WalletNotConnectedError();

        const publicKey = new SolanaPublicKey(this.publicKey);
        transaction.feePayer = transaction.feePayer || publicKey;
        // transaction.recentBlockhash = await getRecentBlockHash<ChainTicker>(this.chain, connection, transaction);
        transaction.recentBlockhash =
            transaction.recentBlockhash ||
            (await (await asyncEnsureRpcConnection(connection)).getLatestBlockhash())?.blockhash;

        return transaction;
    };
}

export const scopePollingDetectionStrategy = (detect: () => boolean): void => {
    // Early return when server-side rendering
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const disposers: (() => void)[] = [];

    function detectAndDispose() {
        const detected = detect();
        if (detected) {
            for (const dispose of disposers) {
                dispose();
            }
        }
    }

    // Strategy #1: Try detecting every second.
    const interval =
        // TODO: #334 Replace with idle callback strategy.
        setInterval(detectAndDispose, 1000);
    disposers.push(() => clearInterval(interval));

    // Strategy #2: Detect as soon as the DOM becomes 'ready'/'interactive'.
    if (
        // Implies that `DOMContentLoaded` has not yet fired.
        document.readyState === 'loading'
    ) {
        document.addEventListener('DOMContentLoaded', detectAndDispose, { once: true });
        disposers.push(() => document.removeEventListener('DOMContentLoaded', detectAndDispose));
    }

    // Strategy #3: Detect after the `window` has fully loaded.
    if (
        // If the `complete` state has been reached, we're too late.
        document.readyState !== 'complete'
    ) {
        window.addEventListener('load', detectAndDispose, { once: true });
        disposers.push(() => window.removeEventListener('load', detectAndDispose));
    }

    // Strategy #4: Detect synchronously, now.
    detectAndDispose();
};
