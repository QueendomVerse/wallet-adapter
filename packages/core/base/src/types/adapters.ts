import type { WalletAdapter, WalletReadyState } from '../adapter';
import type { SignerWalletAdapter, MessageSignerWalletAdapter } from '../signer';
import type { ChainPublicKey, ChainTransaction, ChainConnection, ChainTransactionSignature } from './chains';

export interface Wallet<
    PublicKey extends ChainPublicKey,
    Transaction extends ChainTransaction,
    Connection extends ChainConnection,
    TransactionSignature extends ChainTransactionSignature
> {
    adapter?: Adapter<PublicKey, Transaction, Connection, TransactionSignature>;
    readyState: WalletReadyState;
}

export interface ExtendedWalletAdapter
    extends WalletAdapter<ChainPublicKey, ChainTransaction, ChainConnection, ChainTransactionSignature> {
    autoConnect: boolean;
    adapter?: ExtendedWalletAdapter;
    // connect(privateKey?: string): Promise<void>;
    connect(
        chain?: string,
        label?: string,
        // privateKey?: string
        privateKey?: Uint8Array
    ): Promise<void>;
    connecting: boolean;
    select(chain?: string, label?: string, privateKey?: string): Promise<void>;
    wallet: Wallet<ChainPublicKey, ChainTransaction, ChainConnection, ChainTransactionSignature>;
    wallets: Wallet<ChainPublicKey, ChainTransaction, ChainConnection, ChainTransactionSignature>[];
}

export type Adapter<
    PublicKey extends ChainPublicKey,
    Transaction extends ChainTransaction,
    Connection extends ChainConnection,
    TransactionSignature extends ChainTransactionSignature
> =
    | WalletAdapter<PublicKey, Transaction, Connection, TransactionSignature>
    | SignerWalletAdapter<PublicKey, Transaction, Connection, TransactionSignature>
    | MessageSignerWalletAdapter<PublicKey, Transaction, Connection, TransactionSignature>;
