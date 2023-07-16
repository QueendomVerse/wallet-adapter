import type { FC, ReactNode } from 'react';
import React from 'react';

import type { ChainTicker, WalletError, WalletName } from '@mindblox-wallet-adapter/base';
import type { SolanaAdapter } from '@mindblox-wallet-adapter/solana';
import {
    ConnectionProvider as SolanaConnectionProvider,
    validSolanaAdapterNames,
    WalletProvider as SolanaWalletProvider,
} from '@mindblox-wallet-adapter/solana';
import {
    ConnectionProvider as NearConnectionProvider,
    WalletProvider as NearWalletProvider,
    BrowserWalletProvider as NearBrowserWalletProvider,
} from '@mindblox-wallet-adapter/near';

import { initializeAdapters } from './utils';
import type { WebWalletAdapterConfig } from './adapter';
import { ExtendedAdapter } from './adapter';
import type { Wallet } from './hooks';
import { useWalletAdapterConfig } from './hooks';
import type { WebWallet } from './core';
import type { ChainAdapterNetworks } from '@mindblox-wallet-adapter/networks';
import { ChainAdapterNetwork, useNearAccount } from '@mindblox-wallet-adapter/networks';

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
    chain: ChainTicker;
    network: ChainAdapterNetworks;
    wallets?: (WebWallet | Wallet)[];
    autoConnect?: boolean;
    onError?: (error: WalletError) => void;
    localStorageKey?: string;
}

export const WalletProviders: FC<WalletProps> = ({ children, chain, network }: WalletProps) => {
    const config: WebWalletAdapterConfig = {
        name: 'WebWalet' as WalletName,
        chain,
        network,
    };
    const { setAdapterConfig } = useWalletAdapterConfig();
    setAdapterConfig(config);

    const adapters = initializeAdapters(config);

    const solanaAdapters = adapters.filter((adapter) =>
        validSolanaAdapterNames.includes(adapter.name)
    ) as SolanaAdapter[];

    return (
        <SolanaWalletProvider wallets={solanaAdapters}>
            <NearWalletProvider>
                <NearBrowserWalletProvider>{children}</NearBrowserWalletProvider>
            </NearWalletProvider>
        </SolanaWalletProvider>
    );
};
