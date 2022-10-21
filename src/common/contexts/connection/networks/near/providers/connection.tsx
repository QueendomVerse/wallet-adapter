import React, { useCallback, useEffect, useRef, useState } from "react";
import { TokenInfo, ENV as ChainId } from "@solana/spl-token-registry";
import { Keypair, clusterApiUrl, Connection } from "@solana/web3.js";
import getConfig from "next/config";
import cf from "cross-fetch";
import fetch from "fetch-retry";

import {
  useLocalStorageState,
  asyncEnsureRpcConnection,
} from "../../../../../utils/utils";
import { getTokenListContainerPromise } from "../../../../../utils";
import { useQuerySearch } from "../../../../../hooks";
import { WalletAdapterNetwork } from "../../core";

// Attempt at preventing infinite recursions
// https://github.com/solana-labs/solana/issues/24366
const crossRetry = fetch(cf);

const nextConfig = getConfig();
const publicRuntimeConfig = nextConfig.publicRuntimeConfig;

export type ENDPOINT_NAME =
  | "mainnet-beta"
  | "testnet"
  | "devnet"
  | "localnet"
  | "lending";

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
    name: publicRuntimeConfig.publicSolanaNetwork,
    endpoint: publicRuntimeConfig.publicSolanaRpcHost,
    ChainId: getChainId(publicRuntimeConfig.publicSolanaNetwork),
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

const nodeWsUri: string | undefined = publicRuntimeConfig.publicSolanaWsHost;
console.info(`Web Socket endpoint: '${nodeWsUri}'`);

const getConnection = () => {
  return new Connection(DEFAULT_ENDPOINT.endpoint, {
    commitment: "recent",
    disableRetryOnRateLimit: true,
    fetch: crossRetry,
    wsEndpoint: nodeWsUri,
  });
};

const getConnection2 = (endpoint: string) => {
  return new Connection(endpoint, {
    disableRetryOnRateLimit: true,
    fetch: crossRetry,
    wsEndpoint: nodeWsUri,
  });
};

export const ConnectionContext = React.createContext<ConnectionConfig>({
  setEndpointMap: () => {},
  setEndpoint: () => {},
  // connection: new Connection(DEFAULT_ENDPOINT.endpoint, 'recent'),
  connection: getConnection(),
  endpointMap: DEFAULT_ENDPOINT,
  env: ENDPOINTS[0].name,
  endpoint: DEFAULT_ENDPOINT.endpoint,
  tokens: new Map(),
  tokenMap: new Map<string, TokenInfo>(),
});

export const ConnectionProvider = ({ children }: { children: any }) => {
  const searchParams = useQuerySearch();
  const [networkStorage, setNetworkStorage] =
    // @ts-ignore
    useLocalStorageState<ENDPOINT_NAME>("network", DEFAULT_ENDPOINT.name);
  const networkParam = searchParams.get("network");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [savedEndpoint, setEndpointMap] = useLocalStorageState(
    "connectionEndpoint",
    ENDPOINTS[0].endpoint
  );

  const setEndpoint = setEndpointMap;

  let maybeEndpoint;
  if (networkParam) {
    const endpointParam = ENDPOINTS.find(({ name }) => name === networkParam);
    if (endpointParam) {
      maybeEndpoint = endpointParam;
    }
  }

  if (networkStorage && !maybeEndpoint?.endpoint) {
    const endpointStorage = ENDPOINTS.find(
      ({ name }) => name === networkStorage
    );
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

  const env =
    ENDPOINTS.find((end) => end.endpoint === endpointMap.endpoint)?.name ||
    ENDPOINTS[0].name;

  useEffect(() => {
    const fetchTokens = () => {
      return getTokenListContainerPromise().then((container) => {
        const list = container
          .excludeByTag("nft")
          .filterByChainId(endpointMap.ChainId)
          .getList();

        const knownMints = [...list].reduce((map, item) => {
          map.set(item.address, item);
          return map;
        }, new Map<string, TokenInfo>());

        const map = new Map(list.map((item) => [item.address, item]));
        setTokenMap(knownMints);
        setTokens(map);
      });
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
      const id = connection.onAccountChange(
        Keypair.generate().publicKey,
        () => {}
      );
      await (
        await asyncEnsureRpcConnection(connection)
      ).removeAccountChangeListener(id);
    };
    init();
  }, []);

  useEffect(() => {
    const init = async () => {
      const id = connection.onSlotChange(() => null);
      return async () => {
        // connection.removeSlotChangeListener(id);
        await (
          await asyncEnsureRpcConnection(connection)
        ).removeSlotChangeListener(id);
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

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
};
