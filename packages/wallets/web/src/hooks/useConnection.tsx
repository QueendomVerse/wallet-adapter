import type { ChainTicker, NearConnection, SolanaConnection } from '@mindblox-wallet-adapter/base';
import { ChainTickers, WalletError } from '@mindblox-wallet-adapter/base';
import type {
    SOLANA_ENDPOINT_NAME,
    NEAR_ENDPOINT_NAME,
    SolanaConnectionContextState,
    NearConnectionContextState,
} from '@mindblox-wallet-adapter/networks';
import {
    useSolanaConnection,
    useNearConnection,
    SOLANA_ENDPOINTS,
    NEAR_ENDPOINTS,
} from '@mindblox-wallet-adapter/networks';

import { useTickerState } from './useSharedStates';

export type ENDPOINT_NAME = SOLANA_ENDPOINT_NAME | NEAR_ENDPOINT_NAME;
export type ConnectionContextState = SolanaConnectionContextState | NearConnectionContextState;
export type Connection = SolanaConnection | NearConnection;

export const useConnection = <T extends ConnectionContextState>(chain?: ChainTicker): ConnectionContextState => {
    const { selectedTicker } = useTickerState();
    switch (selectedTicker) {
        case ChainTickers.SOL:
            return useSolanaConnection() as T;
        case ChainTickers.NEAR:
            return useNearConnection() as T;
        default:
            throw new WalletError(`useNetworkConnection: Invalid chain ticker '${selectedTicker}'!`);
    }
};

export const getEndpoints = () => {
    const { selectedTicker } = useTickerState();
    console.debug(`Got endpoints for '${selectedTicker}'`);
    switch (selectedTicker) {
        case ChainTickers.SOL:
            return SOLANA_ENDPOINTS;
        case ChainTickers.NEAR:
            return NEAR_ENDPOINTS;
        default:
            throw new WalletError(`Invalid chain ticker '${selectedTicker}'!`);
    }
};
