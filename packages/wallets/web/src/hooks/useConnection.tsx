import type { ChainConnection, ChainTicker, NearConnection, SolanaConnection } from '@mindblox-wallet-adapter/base';
import { ChainTickers, WalletError } from '@mindblox-wallet-adapter/base';
import type {
    SOLANA_ENDPOINT_NAME,
    NEAR_ENDPOINT_NAME,
    SolanaConnectionContextState,
    NearConnectionContextState} from '@mindblox-wallet-adapter/networks';
import {
    useSolanaConnection,
    useNearConnection,
    SOLANA_ENDPOINTS,
    NEAR_ENDPOINTS,
} from '@mindblox-wallet-adapter/networks';

import { useWalletAdapterConfig } from './useSharedStates';

export type ENDPOINT_NAME = SOLANA_ENDPOINT_NAME | NEAR_ENDPOINT_NAME;
export type ConnectionContextState = SolanaConnectionContextState | NearConnectionContextState;
export type Connection = SolanaConnection | NearConnection;

export const useConnection = <T extends ConnectionContextState>(): ConnectionContextState => {
    const { adapterConfig } = useWalletAdapterConfig()
    switch (adapterConfig.chain) {
        case ChainTickers.SOL:
            return useSolanaConnection() as T;
        case ChainTickers.NEAR:
            return useNearConnection() as T;
        default:
            throw new WalletError(`useNetworkConnection: Invalid chain ticker '${adapterConfig.chain}'!`);
    }
};

export const getEndpoints = () => {
    const { adapterConfig } = useWalletAdapterConfig()
    console.debug(`Got endpoints for '${adapterConfig.chain}'`);
    switch (adapterConfig.chain) {
        case ChainTickers.SOL:
            return SOLANA_ENDPOINTS;
        case ChainTickers.NEAR:
            return NEAR_ENDPOINTS;
        default:
            throw new WalletError(`Invalid chain ticker '${adapterConfig.chain}'!`);
    }
};
