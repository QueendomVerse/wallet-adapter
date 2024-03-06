import type { Connection, Transaction } from '@solana/web3.js';
import { SolanaPublicKey } from './publicKey';

export const getFeePayer = <T extends Transaction>(transaction: T) => transaction?.feePayer;
export const getRecentBlockHash = async (connection: Connection, transaction: Transaction) => {
    if (!transaction || !connection) {
        throw new Error('Connection or Transaction was undefined');
    }
    return transaction.recentBlockhash || (await connection.getLatestBlockhash()).blockhash;
};

const PubKeysInternedMap = new Map<string, SolanaPublicKey>();

export const toPublicKey = (key: string | SolanaPublicKey | undefined): SolanaPublicKey => {
    if (!key) throw new Error('Parameter key cannot be empty!');

    return typeof key === 'string'
        ? PubKeysInternedMap.get(key) ??
              (PubKeysInternedMap.set(key, new SolanaPublicKey(key)).get(key) as SolanaPublicKey)
        : key;
};

export const pubkeyToString = (key: SolanaPublicKey | null | string = ''): string =>
    typeof key === 'string' ? key : key?.toBase58() || '';
