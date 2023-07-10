import React, { useEffect, useRef, useState } from 'react';
import type { TokenInfo } from '@solana/spl-token-registry';
import { ENV as ChainId } from '@solana/spl-token-registry';
import { Keypair, clusterApiUrl, Connection } from '@solana/web3.js';
import * as dotenv from 'dotenv';

export * from './manager';

dotenv.config();

import type {
    ENDPOINT_NAME,
    EndpointMap,
    ConnectionConfig,
    // connectionManager
} from './manager';
import { WalletAdapterNetwork } from '@wallet-adapter/base';
import { fetchWithRetry, useQuerySearch, asyncEnsureRpcConnection } from '@/utils';
import { useLocalStorageState } from '@/hooks';
import { getTokenListContainerPromise } from '../../utils';

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

export const ENDPOINTS: Array<EndpointMap> = [
    {
        name: (process.env.PUBLIC_SOLANA_NETWORK ?? 'mainnet-beta') as ENDPOINT_NAME,
        endpoint: process.env.PUBLIC_SOLANA_RPC_HOST ?? clusterApiUrl('mainnet-beta'),
        ChainId: getChainId(process.env.PUBLIC_SOLANA_NETWORK ?? 'mainnet-beta'),
    },
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
        endpoint: process.env.LOCALNET_SOLANA_RPC_HOST ?? 'http://localhost:8899',
        ChainId: 100,
    },
];

const DEFAULT_ENDPOINT = ENDPOINTS[0];
console.info('Default Endpoint', DEFAULT_ENDPOINT);
const nodeWsUri: string | undefined = process.env.NEXT_PUBLIC_SOLANA_WS_ENDPOINT;
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

export const ConnectionProvider = ({ children }: ConnectionProviderProps) => {
    // const [networkConnection, setNetworkConnection] = useState<Connection>();

    // const { setIsLoading } = useMeta();

    // const [loading, setLoading] = useState<boolean>(true);

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

    // const {
    // status: connectionStatus,
    // response: connectionResponse,
    // error: connectionError,
    // connection: establishedConnection,
    // establishConnection
    // } = connectionManager();

    // useMemo(() => {
    //   if (!connectionError) return;
    //   console.debug(`Solana Connection Error: ${connectionError}`);
    //   setIsLoading(false);
    //   setLoading(false);
    // }, [connectionError])

    // useEffect(() => {
    //   if (!connectionStatus) return;
    //   const onSuccess = () => {
    //     if (connectionResponse) {
    //       console.debug(`Solana connection: ${connectionResponse}`);
    //       notify({
    //         message: 'Chain Connection',
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
    //         message: 'Chain Connection',
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
    //     console.debug('Connection not yet established, forcing an initial one ...');
    //     return new Connection(endpointMap.endpoint);
    //   }
    //   return establishedConnection;
    // }, [establishedConnection])

    // const { current: connection } = useRef(establishedConnection);
    // const { current: connection } = useRef(networkConnection);
    const { current: connection } = useRef(getConnection2(endpoint));
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
            id && (await (await asyncEnsureRpcConnection(connection)).removeAccountChangeListener(id));
        };
        init();
    }, []);

    useEffect(() => {
        const init = async () => {
            const id = connection.onSlotChange(() => null);
            return async () => {
                // id && connection.removeSlotChangeListener(id);
                id && (await (await asyncEnsureRpcConnection(connection)).removeSlotChangeListener(id));
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
