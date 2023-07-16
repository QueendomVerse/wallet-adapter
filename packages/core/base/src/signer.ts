import type { SendTransactionOptions, WalletAdapter } from './adapter';
import { BaseWalletAdapter } from './adapter';
import type { WalletError as ChainWalletError } from './errors';
import { WalletSendTransactionError, WalletSignTransactionError, handleError } from './errors';
import type {
    ChainTransaction,
    ChainConnection,
    ChainTransactionSignature,
    ChainPublicKey,
    ChainSigner,
    ChainSendOptions,
    UnionSigner,
} from './types';

export interface SignerWalletAdapterProps<Transaction extends ChainTransaction> {
    signTransaction(transaction: Transaction): Promise<Transaction>;
    signAllTransactions(transaction: Transaction[]): Promise<Transaction[]>;
}

export type SignerWalletAdapter<
    PublicKey extends ChainPublicKey,
    Transaction extends ChainTransaction,
    Connection extends ChainConnection,
    TransactionSignature extends ChainTransactionSignature,
    Name extends string = string
> = WalletAdapter<PublicKey, Transaction, Connection, TransactionSignature, Name> &
    SignerWalletAdapterProps<Transaction>;

export abstract class BaseSignerWalletAdapter<
        PublicKey extends ChainPublicKey,
        WalletError extends ChainWalletError,
        Transaction extends ChainTransaction,
        Connection extends ChainConnection,
        TransactionSignature extends ChainTransactionSignature,
        Name extends string = string
    >
    extends BaseWalletAdapter<PublicKey, WalletError, Transaction, Connection, TransactionSignature, Name>
    implements SignerWalletAdapter<PublicKey, Transaction, Connection, TransactionSignature, Name>
{
    sendTransaction = async <
        Signer extends ChainSigner,
        SendOptions extends ChainSendOptions,
        TxSig extends TransactionSignature
    >(
        transaction: Transaction,
        connection: Connection,
        options: SendTransactionOptions<Signer, SendOptions> = {}
    ): Promise<TxSig | string | undefined> => {
        let emit = true;
        try {
            try {
                transaction = await this.prepareTransaction<Transaction, Connection>(transaction, connection);

                const { signers, sendOptions } = options;
                signers?.length && transaction.partialSign(...(signers as UnionSigner[]));

                transaction = await this.signTransaction(transaction);

                const rawTransaction = transaction.serialize();
                return (await connection.sendRawTransaction(rawTransaction, sendOptions)) as TxSig;
            } catch (error: unknown) {
                // If the error was thrown by `signTransaction`, rethrow it and don't emit a duplicate event
                if (error instanceof WalletSignTransactionError) {
                    emit = false;
                    throw error;
                }
                throw handleError(error, WalletSendTransactionError);
            }
        } catch (error: unknown) {
            if (emit) {
                this.emit('error', handleError(error, WalletSendTransactionError));
            }
            throw error;
        }
    };

    abstract signTransaction(transaction: Transaction): Promise<Transaction>;
    abstract signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}

export interface MessageSignerWalletAdapterProps {
    signMessage(message: Uint8Array): Promise<Uint8Array>;
}

export type MessageSignerWalletAdapter<
    PublicKey extends ChainPublicKey,
    Transaction extends ChainTransaction,
    Connection extends ChainConnection,
    TransactionSignature extends ChainTransactionSignature,
    Name extends string = string
> = SignerWalletAdapter<PublicKey, Transaction, Connection, TransactionSignature, Name> &
    MessageSignerWalletAdapterProps;

export abstract class BaseMessageSignerWalletAdapter<
        PublicKey extends ChainPublicKey,
        WalletError extends ChainWalletError,
        Transaction extends ChainTransaction,
        Connection extends ChainConnection,
        TransactionSignature extends ChainTransactionSignature,
        Name extends string = string
    >
    extends BaseSignerWalletAdapter<PublicKey, WalletError, Transaction, Connection, TransactionSignature, Name>
    implements MessageSignerWalletAdapter<PublicKey, Transaction, Connection, TransactionSignature, Name>
{
    abstract signMessage(message: Uint8Array): Promise<Uint8Array>;
}
