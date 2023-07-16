import { Keypair } from '@solana/web3.js';
import { useMemo } from 'react';

export const useKeypair = (valueStr?: string | null): Keypair | null | undefined =>
    useMemo(() => (typeof valueStr === 'string' ? tryParseKeypair(valueStr) : valueStr), [valueStr]);

const tryParseKeypair = (valueStr: string): Keypair | null => {
    try {
        return Keypair.fromSecretKey(new Uint8Array(JSON.parse(valueStr)));
    } catch {
        return null;
    }
};
