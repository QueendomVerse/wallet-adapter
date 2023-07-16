import { PublicKey } from '@solana/web3.js';

const PubKeysInternedMap = new Map<string, PublicKey>();

export const toPublicKey = (key: string | PublicKey | undefined): PublicKey => {
    if (!key) throw new Error('Parameter key cannot be empty!');

    return typeof key === 'string'
        ? PubKeysInternedMap.get(key) ?? (PubKeysInternedMap.set(key, new PublicKey(key)).get(key) as PublicKey)
        : key;
};

export const pubkeyToString = (key: PublicKey | null | string = ''): string =>
    typeof key === 'string' ? key : key?.toBase58() || '';
