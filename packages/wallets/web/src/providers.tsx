import type { FC, ReactNode } from 'react';
import React from 'react';

import {
    ConnectionProvider as SolanaConnectionProvider,
    WalletProvider as SolanaWalletProvider,
} from './networks/solana';
import {
    ConnectionProvider as NearConnectionProvider,
    WalletProvider as NearWalletProvider,
    BrowserWalletProvider as NearBrowserWalletProvider,
} from './networks/near';
import type { WalletError } from '@mindblox-wallet-adapter/base';
import { initializeWallets } from './setup';
import type { ExtendedAdapter } from './networks';

// import {
//   WalletProvider as SampleWalletProvider
// }from './networks/core/react'

interface ConnectionProps {
    children?: React.ReactNode;
}
export const ConnectionProviders: FC<ConnectionProps> = ({ children }: ConnectionProps) => {
    return (
        <SolanaConnectionProvider>
            <NearConnectionProvider>{children}</NearConnectionProvider>
        </SolanaConnectionProvider>
    );
};

interface WalletProps {
    children: ReactNode;
    wallets?: ExtendedAdapter[];
    autoConnect?: boolean;
    onError?: (error: WalletError) => void;
    localStorageKey?: string;
}

export const WalletProviders: FC<WalletProps> = ({ children }: WalletProps) => {
    return (
        <SolanaWalletProvider wallets={initializeWallets()}>
            <NearWalletProvider>
                <NearBrowserWalletProvider>{children}</NearBrowserWalletProvider>
            </NearWalletProvider>
        </SolanaWalletProvider>
    );
};
