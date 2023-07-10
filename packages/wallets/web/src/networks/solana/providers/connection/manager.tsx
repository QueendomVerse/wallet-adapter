// Known Issues:
// https://github.com/solana-labs/solana/issues/25069
// Working on adding ability to manually close connections:
// https://github.com/solana-labs/solana/issues/26648

import {
    useCallback,
    useState,
    // createContext, useContext
} from 'react';
// import { useBetween } from 'use-between';
import type { Commitment, Connection } from '@solana/web3.js';
import type { TokenInfo, ENV as ChainId } from '@solana/spl-token-registry';
// import cf from 'cross-fetch';
// import fetch from 'fetch-retry';

import { asyncEnsureRpcConnection } from '@web/utils';
import { ConnectionError } from '../../errors';

// Attempt at preventing infinite recursions
// https://github.com/solana-labs/solana/issues/24366
// const crossRetry = fetch(cf);

export type ENDPOINT_NAME =
    | 'mainnet-beta (Triton)'
    | 'mainnet-beta (Triton Staging)'
    | 'mainnet-beta (Solana)'
    | 'mainnet-beta (Serum)'
    | 'mainnet-beta'
    | 'testnet'
    | 'devnet'
    | 'localnet'
    | 'lending';

export type EndpointMap = {
    name: ENDPOINT_NAME;
    endpoint: string;
    ChainId: ChainId | number;
};

export interface ConnectionConfig {
    setEndpointMap: (val: string) => void;
    setEndpoint: (val: string) => void;
    connection: Connection;
    endpointMap: EndpointMap;
    endpoint: string;
    env: ENDPOINT_NAME;
    tokens: Map<string, TokenInfo>;
    tokenMap: Map<string, TokenInfo>;
}

export interface NetworkProps {
    endpoint: string;
    commitmentOrConfig?: Commitment | ConnectionConfig | undefined;
}

export interface EstablishConnectionProps {
    connection?: Connection;
    network?: NetworkProps;
}

export interface ConnectProps {
    status: string;
    response: string | null;
    error: string | null;
    connection: Connection | undefined;
    establishConnection: (props: EstablishConnectionProps) => Promise<void>;
    clearConnection: () => void;
}

// export const ConnectionContext = createContext<Connection>(null!);

// const useShareablePreviousConnectionState = () => {
//   const [prevConnection, setPrevConnection] = useState<Connection | undefined>();
//   console.debug(`>>> Setting previous connection state`, prevConnection);
//   return { prevConnection, setPrevConnection };
// };

export const connectionManager = (): ConnectProps => {
    // console.warn('func: EstablishConnection')
    // const { prevConnection, setPrevConnection } = useBetween(useShareablePreviousConnectionState);

    const [status, setStatus] = useState('idle');
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    // const [toConnection, setToConnection] = useState<Connection | undefined>(prevConnection);
    const [toConnection, setToConnection] = useState<Connection | undefined>();

    const waitForOpenConnection = (connection: Connection): Promise<Connection> => {
        return new Promise((resolve, reject) => {
            const maxNumberOfAttempts = 100;
            const intervalTime = 200; //ms

            let currentAttempt = 0;
            const interval = setInterval(async () => {
                console.info(`Establishing connection with the Solana network ...`);

                const blockHeight = await (await asyncEnsureRpcConnection(connection)).getBlockHeight();
                if (currentAttempt > maxNumberOfAttempts - 1) {
                    clearInterval(interval);
                    reject(new ConnectionError('Maximum number of attempts exceeded'));
                } else if (blockHeight) {
                    clearInterval(interval);
                    resolve(connection);
                }
                currentAttempt++;
            }, intervalTime);
        });
    };

    const handleConnection = useCallback(async (props: EstablishConnectionProps) => {
        // if (prevConnection && await prevConnection.getBlockHeight()) {
        //   console.info(`Using previous solana connection ... `);
        //   return prevConnection;
        // }
        if (props.connection && (await (await asyncEnsureRpcConnection(props.connection)).getBlockHeight())) {
            console.info(`Using existing solana connection ... `);
            return props.connection;
        }
        if (props.network) {
            console.info(`Attempting to establish Solana network connection via: ${props.network.endpoint} ...`);
            // return await waitForOpenConnection(new Connection(props.network.endpoint, {
            // disableRetryOnRateLimit: true,
            // fetch: crossRetry,
            // wsEndpoint: nodeWsUrl
            // }))
        }
        throw new ConnectionError('Failed to set connection!');
    }, []);

    const initConnection = (props: EstablishConnectionProps, timeout = 2000): Promise<string> => {
        // console.warn('func: initConnection');

        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const result = await handleConnection(props);
                    if (result) {
                        const { apiVersion, slot } = (
                            await (await asyncEnsureRpcConnection(result)).getBlockProduction()
                        ).context as { apiVersion: string; slot: number };
                        const blockHeight = await (await asyncEnsureRpcConnection(result)).getBlockHeight();
                        setToConnection(result);
                        // setPrevConnection(result);
                        resolve(
                            `Solana Connection(v: ${apiVersion}) established at block ${blockHeight} ticking at ${slot}`
                        );
                    } else {
                        reject('Failed to establish a connection with the Solana network');
                    }
                } catch (error) {
                    if (error instanceof ConnectionError) {
                        console.error(error);
                        reject(error.message);
                    } else {
                        console.error(error);
                        reject(`Unknown Error: ${error}`);
                    }
                }
            }, timeout);
        });
    };

    // const prevConnection = useContext(ConnectionContext);

    const establishConnection = useCallback(
        async (props: EstablishConnectionProps) => {
            console.warn(`func: establishConnection`);
            setStatus('pending');
            setResponse(null);
            setError(null);
            // setToConnection(undefined);
            // if (prevConnection) {
            //   console.info('Using previously established connection ...', prevConnection)
            //   return setToConnection(prevConnection);
            // }
            // setToConnection(prevConnection);

            if (!props.connection && !props.network) {
                throw new ConnectionError('Unable to establish a connection without network parameters');
            }
            return await initConnection(props)
                .then((response) => {
                    setStatus('success');
                    setResponse(response);
                })
                .catch((error) => {
                    setStatus('error');
                    setError(error);
                });
        },
        [initConnection, toConnection]
    );

    const clearConnection = useCallback(() => {
        console.debug('Clearing Solana connection ...');
        // setPrevConnection(undefined);
    }, []);

    // console.debug('status', status)
    // console.debug('response', response)
    // console.debug('error', error)
    // console.debug('toConnection', toConnection)
    // console.debug('prevConnection', prevConnection)

    return {
        status,
        response,
        error,
        connection: toConnection,
        establishConnection,
        clearConnection,
    };
};
