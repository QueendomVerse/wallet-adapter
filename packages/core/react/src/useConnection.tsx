import type { Connection } from '@solana/web3.js';
import { createContext, useContext } from 'react';

export interface ConnectionContextState {
    connection: Connection;
}

export const ConnectionContext = createContext<ConnectionContextState>({} as ConnectionContextState);

export const useConnection = (): ConnectionContextState => {
    return useContext(ConnectionContext);
};
