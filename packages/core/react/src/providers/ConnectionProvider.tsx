import type { ReactNode } from 'react';
import React, { useMemo } from 'react';
import { ConnectionContext } from '../hooks';
import type { ChainConnectionConfig, ChainConnection } from '@mindblox-wallet-adapter/base';

export interface ConnectionProviderProps<Connection extends ChainConnection> {
    children: ReactNode;
    connectionConstructor: new (endpoint: string, config: ChainConnectionConfig) => Connection;
    endpoint: string;
    config: ChainConnectionConfig;
}

export const ConnectionProvider = <Connection extends ChainConnection>({
    children,
    connectionConstructor,
    endpoint,
    config,
}: ConnectionProviderProps<Connection>): JSX.Element => {
    const connection = useMemo(() => new connectionConstructor(endpoint, config), [endpoint, config]);

    return <ConnectionContext.Provider value={{ connection }}>{children}</ConnectionContext.Provider>;
};
