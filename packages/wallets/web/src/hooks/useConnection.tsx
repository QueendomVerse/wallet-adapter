import { useContext, useState } from 'react';
// import { useBetween } from 'use-between';
import type { Connection } from '@solana/web3.js';

import { WalletError } from '@mindblox-wallet-adapter/base';
import { ChainTickers } from '../chains';
import type {
    ENDPOINT_NAME as SOLANA_ENDPOINT_NAME,
    WalletContextState as SolanaWalletContextState,
} from '../networks/solana';
import { ConnectionContext as SolanaConnectionContext, ENDPOINTS as SOLANA_ENDPOINTS } from '../networks/solana';
import type {
    ENDPOINT_NAME as NEAR_ENDPOINT_NAME,
    WalletContextState as NearWalletContextState,
} from '../networks/near';
import {
    // ConnectionContext as NearConnectionContext,
    ENDPOINTS as NEAR_ENDPOINTS,
} from '../networks/near';

// import { holdUrHorses } from '../../utils';

export type SolanaConnection = Connection;

export type ENDPOINT_NAME = SOLANA_ENDPOINT_NAME | NEAR_ENDPOINT_NAME;

export type WalletContextState = SolanaWalletContextState | NearWalletContextState;

// const useShareableConnectionLastAccessedState = () => {
//   const [lastAccessed, setLastAccessed] = useState<number | undefined>();
//   console.debug(`>>> Setting connection last accessed state`, lastAccessed);
//   return { lastAccessed, setLastAccessed };
// };

// const MIN_CONNECTION_ACCESS_INTERVAL = 10;

export const useConnectionContext = (ticker?: string) => {
    // console.debug(`Using '${ticker}' connection context.`);
    // const { lastAccessed, setLastAccessed } = useBetween(useShareableConnectionLastAccessedState);
    // if (lastAccessed < Date.now() - MIN_CONNECTION_ACCESS_INTERVAL)
    // setLastAccessed(Date.now())
    switch (ticker) {
        case ChainTickers.SOL:
            return useContext(SolanaConnectionContext);
        // case ChainTickers.NEAR: return useContext(NearConnectionContext);
        case ChainTickers.NEAR:
            return useContext(SolanaConnectionContext);
        default:
            return useContext(SolanaConnectionContext);
        // throw new WalletError(`Invalid chain ticker '${ticker}'!`);
    }
};

export const getEndpoints = (ticker?: string) => {
    // console.debug(`Got endpoints for '${ticker}'`);
    switch (ticker) {
        case ChainTickers.SOL:
            return SOLANA_ENDPOINTS;
        case ChainTickers.NEAR:
            return NEAR_ENDPOINTS;
        // case ChainTickers.NEAR: return SOLANA_ENDPOINTS;
        default:
            throw new WalletError(`Invalid chain ticker '${ticker}'!`);
    }
};

// export const useConnection = useSampleConnection

export const useConnection = (ticker?: string): Connection => {
    const onSolana = () => {
        const connection = useContext(SolanaConnectionContext).connection;
        return connection;
    };

    // const onNear = () => {
    //   const connection =  useContext(NearConnectionContext).connection;
    //   return connection;
    // }

    // console.debug(`Connecting via '${ticker}'`);
    // const context = useConnectionContext(chain); //@BUG causes webpack error
    switch (ticker) {
        case ChainTickers.SOL:
            return onSolana();
        // case ChainTickers.NEAR: return onNear();
        case ChainTickers.NEAR:
            return onSolana();
        default:
            return onSolana();
        //  throw new WalletError(`Invalid chain ticker '${ticker}'!`);
    }
};
//   switch (chain) {
//     case ChainTickers.SOL:
//       return useConnectionContext(chain).connection;
//     case ChainTickers.NEAR:
//       return useConnectionContext(chain).connection;
//     default:
// throw new WalletError(`Invalid chain network '${chain}'!`);
//   }
// };

export const useConnectionConfig = (chain?: string) => {
    // console.debug(`Using '${chain}' connection configuration.`);
    const context = useConnectionContext(chain);
    return {
        setEndpointMap: context.setEndpointMap,
        setEndpoint: context.setEndpoint,
        endpointMap: context.endpointMap,
        endpoint: context.endpoint,
        env: context.env,
        tokens: context.tokens,
        tokenMap: context.tokenMap,
    };
};
