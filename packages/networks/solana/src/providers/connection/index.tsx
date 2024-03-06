import React, { useEffect, useRef, useState } from 'react';
import type { TokenInfo } from '@solana/spl-token-registry';
import { ENV as ChainId } from '@solana/spl-token-registry';
import type { Cluster } from '@solana/web3.js';
import { Keypair, clusterApiUrl } from '@solana/web3.js';

// import {
//     fetchWithRetry,
//     asyncEnsureRpcConnection,
// } from '@mindblox-wallet-adapter/base';
import { useLocalStorage } from '@mindblox-wallet-adapter/react';

import {
    type ENDPOINT_NAME,
    type EndpointMap,
    type ConnectionContextState,
    WalletAdapterNetwork,

    // connectionManager
} from './manager';
import { getTokenListContainerPromise } from '../../utils';
import { SolanaConnection } from '../../types/connection';

export * from './manager';

export type ENV = ENDPOINT_NAME;

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

export const getAdapterCluster = (cluster?: string): Cluster => {
    if (!cluster) return WalletAdapterNetwork.Devnet;
    switch (cluster) {
        case 'devnet':
            return WalletAdapterNetwork.Devnet;
        case 'testnet':
            return WalletAdapterNetwork.Testnet;
        case 'mainnet-beta':
            return WalletAdapterNetwork.Mainnet;
        default:
            return WalletAdapterNetwork.Devnet;
    }
};

export const getAdapterNetwork = (network?: string): WalletAdapterNetwork => {
    if (!network) return WalletAdapterNetwork.Devnet;
    switch (network) {
        case 'devnet':
        case 'testnet':
        case 'mainnet-beta':
            return getAdapterCluster(network) as WalletAdapterNetwork;
        case 'localnet':
            return WalletAdapterNetwork.Localnet;
        default:
            return WalletAdapterNetwork.Devnet;
    }
};


export const getEndpointMap = (name: ENDPOINT_NAME): EndpointMap => ({
    name,
    endpoint: clusterApiUrl(getAdapterCluster(name)),
    ChainId: getChainId(name),
});

export const ENDPOINTS: Array<EndpointMap> = [
    {
        name: 'mainnet-beta (Solana)',
        endpoint: 'https://api.mainnet-beta.solana.com',
        ChainId: ChainId.MainnetBeta,
    },
    {
        name: 'mainnet-beta (Serum)',
        endpoint: 'https://solana-api.projectserum.com/',
        ChainId: ChainId.MainnetBeta,
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
    {
        name: 'localnet',
        endpoint: 'http://localhost:8899',
        ChainId: 100,
    },
];
// export const ENDPOINTS: Array<EndpointMap> = Object.values(WalletAdapterNetwork).map(getEndpointMap);

const DEFAULT_ENDPOINT = ENDPOINTS[0];
// console.debug('Default Solana Endpoint', DEFAULT_ENDPOINT);

const getConnection = (endpoint: string, nodeWsUri?: string) => {
    // console.debug(`Establishing Solana connection with endpoint: '${endpoint}'`);
    // console.debug(`Solana Web Socket endpoint: '${nodeWsUri}'`);

    return new SolanaConnection(endpoint, {
        commitment: 'recent',
        disableRetryOnRateLimit: true,
        // fetch: fetchWithRetry,
        wsEndpoint: nodeWsUri,
    });
};

export const ConnectionContext = React.createContext<ConnectionContextState>({
    setEndpointMap: () => {
        console.warn('setEndpointMap function not implemented.');
    },
    setEndpoint: () => {
        console.warn('setEndpoint function not implemented.');
    },
    // connection: new SolanaConnection(DEFAULT_ENDPOINT.endpoint, 'recent'),
    // connection: getConnection(DEFAULT_ENDPOINT.endpoint),
    endpointMap: DEFAULT_ENDPOINT,
    env: ENDPOINTS[0].name,
    endpoint: DEFAULT_ENDPOINT.endpoint,
    tokens: new Map(),
    tokenMap: new Map<string, TokenInfo>(),
});

interface ConnectionProviderProps {
    network?: ENDPOINT_NAME;
    children: React.ReactNode;
}

export const ConnectionProvider: React.FC<ConnectionProviderProps> = ({ network, children }) => {
    useEffect(() => {
        console.debug(`Solana Connection Provider network: ${network}`);
    }, [network])
    // const [networkConnection, setNetworkConnection] = useState<SolanaConnection>();

    // const { setIsLoading } = useMeta();

    // const [loading, setLoading] = useState<boolean>(true);

    const [networkStorage, setNetworkStorage] =
        useLocalStorage<ENDPOINT_NAME>('network', DEFAULT_ENDPOINT.name);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [savedEndpoint, setEndpointMap] = useLocalStorage('connectionEndpoint', ENDPOINTS[0].endpoint);

    const setEndpoint = setEndpointMap;

    let maybeEndpoint;
    if (network) {
        const endpointParam = ENDPOINTS.find(({ name }) => name === network);
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

    // const {
    // status: connectionStatus,
    // response: connectionResponse,
    // error: connectionError,
    // connection: establishedConnection,
    // establishConnection
    // } = connectionManager();

    // useMemo(() => {
    //   if (!connectionError) return;
    //   console.debug(`Solana SolanaConnection Error: ${connectionError}`);
    //   setIsLoading(false);
    //   setLoading(false);
    // }, [connectionError])

    // useEffect(() => {
    //   if (!connectionStatus) return;
    //   const onSuccess = () => {
    //     if (connectionResponse) {
    //       console.debug(`Solana connection: ${connectionResponse}`);
    //       notify({
    //         message: 'Chain SolanaConnection',
    //         description: 'Solana network connection established.',
    //         type: 'success',
    //       });
    //     }
    //     setIsLoading(false);
    //     setLoading(false);
    //   }
    //   const onError = () => {
    //     if (connectionResponse) {
    //       console.debug(`Solana connection Error: ${connectionResponse}`);
    //       notify({
    //         message: 'Chain SolanaConnection',
    //         description: 'Failed to establish connection with the Solana network!',
    //         type: 'error',
    //       });
    //     }
    //     setIsLoading(false);
    //     setLoading(false);
    //   }
    //   switch (connectionStatus) {
    //     case 'success': return onSuccess();
    //     case 'error': return onError();
    //   }
    // }, [connectionStatus, connectionResponse])

    // useMemo(async() => {
    //   if (!establishedConnection) await establishConnection({network: endpointMap});
    // }, [])

    // const networkConnection = useMemo(() => {
    //   if (!establishedConnection) {
    //     console.debug('SolanaConnection not yet established, forcing an initial one ...');
    //     return new SolanaConnection(endpointMap.endpoint);
    //   }
    //   return establishedConnection;
    // }, [establishedConnection])

    // const { current: connection } = useRef(establishedConnection);
    // const { current: connection } = useRef(networkConnection);
    const { current: connection } = useRef(getConnection(endpoint));
    // setIsLoading(false);

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
    //     id && connection.removeAccountChangeListener(id);
    //   };
    // }, []);
    useEffect(() => {
        const init = async () => {
            const id = connection.onAccountChange(Keypair.generate().publicKey, () => {
                // No operations to perform upon account change
            });
            if (connection && id) {
                connection.removeAccountChangeListener(id);
            }
        };
        init();
    }, []);

    useEffect(() => {
        const init = async () => {
            const id = connection.onSlotChange(() => null);
            return async () => {
                if (connection && id) {
                    connection.removeSlotChangeListener(id);
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

    // if (loading) return (<Loader />);

    return <ConnectionContext.Provider value={contextValue}>{children}</ConnectionContext.Provider>;
};

export const useConnection = () => {
    const context = React.useContext(ConnectionContext);
    if (!context) {
        throw new Error('Unable to establish connection to the Solana network.');
    }
    return context;
};
