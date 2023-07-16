import type { ChainConnection } from '@mindblox-wallet-adapter/base';
import { createContext, useContext } from 'react';

export interface ConnectionContextState<Connection extends ChainConnection> {
    connection: Connection;
}

const createConnectionContext = <Connection extends ChainConnection>() => {
    const DEFAULT_CONTEXT = {} as ConnectionContextState<Connection>;

    return createContext<ConnectionContextState<Connection>>(DEFAULT_CONTEXT);
};

export const ConnectionContext = createConnectionContext();

export const useConnection = (): ConnectionContextState<ChainConnection> => {
    if (!ConnectionContext) {
        throw new Error('Unable to use Connection');
    }
    return useContext(ConnectionContext);
};
