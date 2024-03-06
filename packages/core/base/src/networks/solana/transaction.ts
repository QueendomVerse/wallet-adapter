import type { Transaction, TransactionVersion, VersionedTransaction } from '@solana/web3.js';

export type SupportedTransactionVersions = ReadonlySet<TransactionVersion> | null | undefined;

export interface TransactionOrVersionedTransaction<S extends SupportedTransactionVersions> {
  transaction: S extends null | undefined ? Transaction : Transaction | VersionedTransaction;
}

export const isVersionedTransaction = (
    transaction: Transaction | VersionedTransaction
): transaction is VersionedTransaction => {
    return 'version' in transaction;
}