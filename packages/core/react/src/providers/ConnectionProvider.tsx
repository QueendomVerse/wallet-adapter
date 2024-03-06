import type { ReactNode } from 'react';
import React, { useMemo } from 'react';
import { ConnectionContext } from '../hooks';
import type { ChainConnection } from '@mindblox-wallet-adapter/base';

export interface ConnectionProviderProps<Connection extends ChainConnection> {
    children: ReactNode;
    connectionConstructor: new (endpoint: string) => Connection;
    endpoint: string;
}

export const ConnectionProvider = <Connection extends ChainConnection>({
    children,
    connectionConstructor,
    endpoint
}: ConnectionProviderProps<Connection>): JSX.Element => {
    const connection = useMemo(() => new connectionConstructor(endpoint), [endpoint]);

    return <ConnectionContext.Provider value={{ connection }}>{children}</ConnectionContext.Provider>;
};
