import { SolanaPublicKey } from '@mindblox-wallet-adapter/base';
import { useMemo } from 'react';

export const usePubkey = (raw?: SolanaPublicKey | string | null): SolanaPublicKey | null | undefined =>
    useMemo(
        () => (raw instanceof SolanaPublicKey ? raw : typeof raw === 'string' ? tryCreatePublicKey(raw) : raw),
        [raw]
    );

const tryCreatePublicKey = (raw: string): SolanaPublicKey | null => {
    try {
        return new SolanaPublicKey(raw);
    } catch {
        return null;
    }
};
