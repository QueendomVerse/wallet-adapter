import React, { useEffect, useRef, useState } from 'react';
import type { TokenInfo } from '@solana/spl-token-registry';
import { ENV as ChainId } from '@solana/spl-token-registry';
import { Keypair, clusterApiUrl, Connection } from '@solana/web3.js';
import * as dotenv from 'dotenv';

import { asyncEnsureRpcConnection, fetchWithRetry, useQuerySearch } from '@/utils';
import { useLocalStorageState } from '@/hooks';

import { getTokenListContainerPromise } from '../../solana';

import { WalletAdapterNetwork } from '@mindblox-wallet-adapter/base';

dotenv.config();

export type ENDPOINT_NAME = 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet' | 'lending';

export type ENV = ENDPOINT_NAME;

type EndpointMap = {
    name: ENDPOINT_NAME;
    endpoint: string;
    ChainId: ChainId;
};

const getChainId = (network: string) => {
    switch (network) {
        case WalletAdapterNetwork.Mainnet:
            return ChainId.MainnetBeta;
        case WalletAdapterNetwork.Testnet:
            return ChainId.Testnet;
        case WalletAdapterNetwork.Devnet:
            return ChainId.Devnet;
        default:
            return ChainId.Devnet;
    }
};

export const ENDPOINTS: Array<EndpointMap> = [
    {
        name: (process.env.PUBLIC_SOLANA_NETWORK ?? 'mainnet-beta') as ENDPOINT_NAME,
        endpoint: process.env.PUBLIC_SOLANA_RPC_HOST ?? clusterApiUrl('mainnet-beta'),
        ChainId: getChainId(process.env.PUBLIC_SOLANA_NETWORK ?? 'mainnet-beta'),
    },
    {
        name: WalletAdapterNetwork.Mainnet,
        endpoint: clusterApiUrl(WalletAdapterNetwork.Mainnet),
        ChainId: ChainId.MainnetBeta,
    },
    {
        name: WalletAdapterNetwork.Testnet,
        endpoint: clusterApiUrl(WalletAdapterNetwork.Testnet),
        ChainId: ChainId.Testnet,
    },
    {
        name: WalletAdapterNetwork.Devnet,
        endpoint: clusterApiUrl(WalletAdapterNetwork.Devnet),
        ChainId: ChainId.Devnet,
    },
];

const DEFAULT_ENDPOINT = ENDPOINTS[0];

interface ConnectionConfig {
    setEndpointMap: (val: string) => void;
    setEndpoint: (val: string) => void;
    connection: Connection;
    endpointMap: EndpointMap;
    endpoint: string;
    env: ENDPOINT_NAME;
    tokens: Map<string, TokenInfo>;
    tokenMap: Map<string, TokenInfo>;
}

const nodeWsUri: string | undefined = process.env.PUBLIC_SOLANA_WS_HOST;
console.info(`Web Socket endpoint: '${nodeWsUri}'`);

const getConnection = () => {
    return new Connection(DEFAULT_ENDPOINT.endpoint, {
        commitment: 'recent',
        disableRetryOnRateLimit: true,
        fetch: fetchWithRetry,
        wsEndpoint: nodeWsUri,
    });
};

const getConnection2 = (endpoint: string) => {
    return new Connection(endpoint, {
        disableRetryOnRateLimit: true,
        fetch: fetchWithRetry,
        wsEndpoint: nodeWsUri,
    });
};
export const ConnectionContext = React.createContext<ConnectionConfig>({
    setEndpointMap: () => {
        console.warn('setEndpointMap function not implemented.');
    },
    setEndpoint: () => {
        console.warn('setEndpoint function not implemented.');
    },
    // connection: new Connection(DEFAULT_ENDPOINT.endpoint, 'recent'),
    connection: getConnection(),
    endpointMap: DEFAULT_ENDPOINT,
    env: ENDPOINTS[0].name,
    endpoint: DEFAULT_ENDPOINT.endpoint,
    tokens: new Map(),
    tokenMap: new Map<string, TokenInfo>(),
});

interface ConnectionProviderProps {
    children: React.ReactNode;
}

export const ConnectionProvider: React.FC<ConnectionProviderProps> = ({ children }) => {
    const searchParams = useQuerySearch();
    const [networkStorage, setNetworkStorage] =
        // @ts-ignore
        useLocalStorageState<ENDPOINT_NAME>('network', DEFAULT_ENDPOINT.name);
    const networkParam = searchParams.get('network');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [savedEndpoint, setEndpointMap] = useLocalStorageState('connectionEndpoint', ENDPOINTS[0].endpoint);

    const setEndpoint = setEndpointMap;

    let maybeEndpoint;
    if (networkParam) {
        const endpointParam = ENDPOINTS.find(({ name }) => name === networkParam);
        if (endpointParam) {
            maybeEndpoint = endpointParam;
        }
    }

    if (networkStorage && !maybeEndpoint?.endpoint) {
        const endpointStorage = ENDPOINTS.find(({ name }) => name === networkStorage);
        if (endpointStorage) {
            maybeEndpoint = endpointStorage;
        }
    }

    const endpointMap = maybeEndpoint || DEFAULT_ENDPOINT;
    const endpoint = maybeEndpoint?.endpoint || DEFAULT_ENDPOINT.endpoint;

    // const { current: connection } = useRef(new Connection(endpointMap.endpoint));
    const { current: connection } = useRef(getConnection2(endpointMap.endpoint));

    const [tokens, setTokens] = useState<Map<string, TokenInfo>>(new Map());
    const [tokenMap, setTokenMap] = useState<Map<string, TokenInfo>>(new Map());

    const env = ENDPOINTS.find((end) => end.endpoint === endpointMap.endpoint)?.name || ENDPOINTS[0].name;

    useEffect(() => {
        const fetchTokens = async () => {
            try {
                const tokenListContainer = await getTokenListContainerPromise();

                if (!tokenListContainer) {
                    return;
                }

                const list = tokenListContainer.excludeByTag('nft').filterByChainId(endpointMap.ChainId).getList();

                const knownMints = [...list].reduce((map, item) => {
                    map.set(item.address, item);
                    return map;
                }, new Map<string, TokenInfo>());

                const map = new Map(list.map((item) => [item.address, item]));
                setTokenMap(knownMints);
                setTokens(map);
            } catch (err) {
                console.error(err);
            }
        };

        fetchTokens();
    }, []);

    useEffect(() => {
        const updateNetworkInLocalStorageIfNeeded = () => {
            if (networkStorage !== endpointMap.name) {
                setNetworkStorage(endpointMap.name);
            }
        };

        updateNetworkInLocalStorageIfNeeded();
    }, []);

    // solana/web3.js closes its websocket connection when the subscription list
    // is empty after opening for the first time, preventing subsequent
    // subscriptions from receiving responses.
    // This is a hack to prevent the list from ever being empty.
    // useEffect(() => {
    //   const id = connection.onAccountChange(
    //     Keypair.generate().publicKey,
    //     () => {},
    //   );
    //   return () => {
    //     connection.removeAccountChangeListener(id);
    //   };
    // }, []);

    useEffect(() => {
        const init = async () => {
            const id = connection.onAccountChange(Keypair.generate().publicKey, () => {
                /* This callback is intentionally left blank */
            });
            const conn = await asyncEnsureRpcConnection(connection);
            if (conn) {
                conn.removeAccountChangeListener(id);
            }
        };
        init();
    }, []);

    useEffect(() => {
        const init = async () => {
            const id = connection.onSlotChange(() => null);
            return async () => {
                const conn = await asyncEnsureRpcConnection(connection);
                if (conn) {
                    conn.removeSlotChangeListener(id);
                }
            };
        };
        init();
    }, []);

    const contextValue = React.useMemo(() => {
        return {
            setEndpointMap,
            setEndpoint,
            endpointMap,
            endpoint,
            connection,
            tokens,
            tokenMap,
            env,
        };
    }, [tokens]);

    return <ConnectionContext.Provider value={contextValue}>{children}</ConnectionContext.Provider>;
};
