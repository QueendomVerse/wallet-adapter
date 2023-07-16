import type { Connection, Transaction } from '@solana/web3.js';
import { useLocalStorage } from '../../utils';
import { SolanaPublicKey } from './types';

export const getFeePayer = <T extends Transaction>(transaction: T) => transaction?.feePayer;
export const getRecentBlockHash = async (connection: Connection, transaction: Transaction) => {
    if (!transaction || !connection) {
        throw new Error('Connection or Transaction was undefined');
    }
    return transaction.recentBlockhash || (await connection.getLatestBlockhash()).blockhash;
};

export const findProgramAddress = (seeds: (Buffer | Uint8Array)[], programId: SolanaPublicKey) => {
    if (!seeds || seeds.length < 1 || !programId) return;
    const localStorage = useLocalStorage();
    const key = 'pda-' + seeds.reduce((agg, item) => agg + item?.toString('hex'), '') + programId.toString();
    const cached = localStorage.getItem(key);
    if (cached) {
        const value = JSON.parse(cached);
        return [value.key, parseInt(value.nonce)] as [string, number];
    }
    let result: [SolanaPublicKey, number] = [new SolanaPublicKey('So11111111111111111111111111111111111111112'), 0];
    try {
        result = SolanaPublicKey.findProgramAddressSync(seeds, programId);
    } catch (e) {
        console.error(e);
        return;
    }
    try {
        localStorage.setItem(key, JSON.stringify({ key: result[0].toBase58(), nonce: result[1] }));
    } catch {
        /* ignore */
    }
    return [result[0].toBase58(), result[1]] as [string, number];
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
