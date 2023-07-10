import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';

export const usePubkey = (raw?: PublicKey | string | null): PublicKey | null | undefined =>
    useMemo(() => (raw instanceof PublicKey ? raw : typeof raw === 'string' ? tryCreatePublicKey(raw) : raw), [raw]);

const tryCreatePublicKey = (raw: string): PublicKey | null => {
    try {
        return new PublicKey(raw);
    } catch {
        return null;
    }
};
