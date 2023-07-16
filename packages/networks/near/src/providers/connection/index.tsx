import React, { useContext, useEffect, useRef, useState } from 'react';

// import {
//     Contract,
//     WalletConnection,
//     // KeyPair,
//     utils,
//     transactions,
// } from 'near-api-js';
import { JsonRpcProvider, Provider } from 'near-api-js/lib/providers';
import { InMemorySigner, type Signer } from 'near-api-js/lib/signer';
import * as dotenv from 'dotenv';

import { Connection } from './middleware';
import type { TokenInfo } from '../../types';
import { WalletAdapterNetwork, clusterApiUrl, clusterHelperUrl } from './core/utils/cluster';
import { keyStores, providers } from 'near-api-js';
import type { Chain } from '@mindblox-wallet-adapter/base';
import {
    asyncEnsureRpcConnection,
    ChainNetworks,
    NearConnection,
    NearKeypair,
    useQuerySearch,
} from '@mindblox-wallet-adapter/base';
import { useLocalStorageState } from '@mindblox-wallet-adapter/react';
import { getAdapterCluster, getAdapterNetwork } from '../../utils';

export * from './core';

dotenv.config();

enum ChainId {
    Mainnet = 101,
    Testnet = 102,
    Betanet = 103,
}

export type ENDPOINT_NAME = 'mainnet' | 'testnet' | 'betanet' | 'localnet' | 'lending';

export type ENV = ENDPOINT_NAME;

export type EndpointMap = {
    name: ENDPOINT_NAME;
    endpoint: string;
    ChainId: ChainId | number;
    networkId: WalletAdapterNetwork;
    nodeUrl: string;
    walletUrl: string;
    helperUrl: string;
    jsvmAccountId: string;
};

// export class NearConnection extends Connection {
//     public chain: Chain = ChainNetworks.NEAR;
// }

const getChainId = (network: string) => {
    switch (network) {
        case 'mainnet':
            return ChainId.Mainnet;
        case 'testnet':
            return ChainId.Testnet;
        case 'betanet':
            return ChainId.Betanet;
        default:
            return ChainId.Betanet;
    }
};

export const getEndpointMap = (name: ENDPOINT_NAME): EndpointMap => ({
    name,
    endpoint: getAdapterCluster(name),
    ChainId: getChainId(name),
    networkId: getAdapterNetwork(name),
    nodeUrl: clusterApiUrl(getAdapterCluster(name)),
    walletUrl: clusterHelperUrl(getAdapterCluster(name)),
    helperUrl: clusterHelperUrl(getAdapterCluster(name)),
    // Assuming that the `jsvmAccountId` for 'mainnet' and 'betanet' follows a similar pattern as 'testnet'
    jsvmAccountId: `jsvm.${name}`,
});

export const ENDPOINTS: Array<EndpointMap> = Object.values(WalletAdapterNetwork).map(getEndpointMap);

const DEFAULT_ENDPOINT = ENDPOINTS[0];

export interface ConnectionContextState {
    chain: Chain | null;
    setEndpointMap: (val: string) => void;
    setEndpoint: (val: string) => void;
    connection: NearConnection;
    endpointMap: EndpointMap;
    endpoint: string;
    env: ENDPOINT_NAME;
    tokens: Map<string, TokenInfo>;
    tokenMap: Map<string, TokenInfo>;
}

const nodeWsUri: string | undefined = process.env.PUBLIC_NEAR_WS_HOST;
console.info(`Web Socket endpoint: '${nodeWsUri}'`);

export const ConnectionContext = React.createContext<ConnectionContextState>({
    chain: ChainNetworks.NEAR,
    setEndpointMap: () => {
        console.warn('setEndpointMap function not implemented.');
    },
    setEndpoint: () => {
        console.warn('setEndpoint function not implemented.');
    },
    connection: new NearConnection({
        nodeUrl: DEFAULT_ENDPOINT.endpoint,
        networkId: DEFAULT_ENDPOINT.networkId,
        jsvmAccountId: DEFAULT_ENDPOINT.jsvmAccountId,
    }),
    // connection: new NearConnection(
    //     DEFAULT_ENDPOINT.endpoint,
    //     DEFAULT_ENDPOINT.networkId,
    //     new providers.JsonRpcProvider({ url: DEFAULT_ENDPOINT.nodeUrl }),
    //     new InMemorySigner(new keyStores.InMemoryKeyStore()),
    //     DEFAULT_ENDPOINT.jsvmAccountId
    // ),
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
    const chain = ChainNetworks.NEAR;
    const searchParams = useQuerySearch();
    const [networkStorage, setNetworkStorage] =
        // @ts-ignore
        useLocalStorageState<WalletAdapterNetwork>('network', DEFAULT_ENDPOINT.name);
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

    console.error('Starting connection ...');
    const { current: connection } = useRef(
        // new NearConnection(
        //     endpointMap.endpoint,
        //     endpointMap.networkId,
        //     new providers.JsonRpcProvider({ url: DEFAULT_ENDPOINT.nodeUrl }) as Provider,
        //     new InMemorySigner(new keyStores.InMemoryKeyStore()) as Signer,
        //     endpointMap.jsvmAccountId
        // )
        new NearConnection({
            nodeUrl: endpointMap.endpoint,
            networkId: endpointMap.networkId,
            jsvmAccountId: endpointMap.jsvmAccountId,
        })
    );

    const [tokens, setTokens] = useState<Map<string, TokenInfo>>(new Map());
    const [tokenMap, setTokenMap] = useState<Map<string, TokenInfo>>(new Map());

    const env = ENDPOINTS.find((end) => end.endpoint === endpointMap.endpoint)?.name || ENDPOINTS[0].name;

    // useEffect(() => {
    //     const fetchTokens = async () => {
    //         try {
    //             const tokenListContainer = await getTokenListContainerPromise();

    //             if (!tokenListContainer) {
    //                 return;
    //             }

    //             const list = tokenListContainer.excludeByTag('nft').filterByChainId(endpointMap.ChainId).getList();

    //             const knownMints = [...list].reduce((map, item) => {
    //                 map.set(item.address, item);
    //                 return map;
    //             }, new Map<string, TokenInfo>());

    //             const map = new Map(list.map((item) => [item.address, item]));
    //             setTokenMap(knownMints);
    //             setTokens(map);
    //         } catch (err) {
    //             console.error(err);
    //         }
    //     };

    //     fetchTokens();
    // }, []);

    useEffect(() => {
        const updateNetworkInLocalStorageIfNeeded = () => {
            if (networkStorage !== endpointMap.name) {
                setNetworkStorage(endpointMap.networkId);
            }
        };

        updateNetworkInLocalStorageIfNeeded();
    }, []);

    useEffect(() => {
        const init = async () => {
            const _keypair = new NearKeypair();
            const id = connection.onAccountChange(_keypair.getPublicKey(), () => {
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
            chain,
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

export const useConnection = () => {
    const context = useContext(ConnectionContext);
    if (!context) {
        throw new Error('Unable to establish a connection to the Near network');
    }
    return context;
};
