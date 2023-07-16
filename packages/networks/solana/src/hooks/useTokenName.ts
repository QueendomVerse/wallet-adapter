import type { SolanaPublicKey } from '@mindblox-wallet-adapter/base';
import { useConnection } from '../providers';
import { getTokenName } from '../utils';

export const useTokenName = (mintAddress?: string | SolanaPublicKey): string => {
    const { tokenMap } = useConnection();
    const address = typeof mintAddress === 'string' ? mintAddress : mintAddress?.toBase58();
    return getTokenName(tokenMap, address);
};
