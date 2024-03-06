'use client';

import type { ReactNode } from 'react';
import React, { useEffect, useMemo } from 'react';

import type { ChainConnection, ChainTicker, WalletError, WalletName } from '@mindblox-wallet-adapter/base';
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
import { UnsafeBurnerWalletAdapter } from '@mindblox-wallet-adapter/unsafe-burner';
import { ConnectionContext } from '@mindblox-wallet-adapter/react';
import { PhantomWalletAdapter } from '@mindblox-wallet-adapter/phantom';
import { ChainConnectionFactory, type ChainAdapterNetwork, type ChainWallet, type NEAR_ENDPOINT_NAME, type SOLANA_ENDPOINT_NAME, NearBrowserWalletAdapter } from '@mindblox-wallet-adapter/networks';

import { useIndexDb, useWalletAdapterConfig } from './hooks';
import { initializeAdapters } from './utils';
import { WebWalletAdapter, type WebWalletAdapterConfig } from './wallet';
import type { WebWallet } from './wallet';
import type { IndexDbAppDatabase } from './indexDb';

interface ConnectionProps {
    networks?: {
        solana?: SOLANA_ENDPOINT_NAME,
        near?: NEAR_ENDPOINT_NAME
    }
    children?: React.ReactNode;
}
export const ConnectionProviders: React.FC<ConnectionProps> = ({ networks, children }: ConnectionProps) => {
    useEffect(() => {
        console.debug(`ConnectionProviders networks: ${JSON.stringify(networks)}`)
    }, [networks])
    
    return (
        <SolanaConnectionProvider network={networks?.solana}>
            <NearConnectionProvider network={networks?.near}>
                {children}
            </NearConnectionProvider>
        </SolanaConnectionProvider>
    );
};

interface WalletProps {
    children?: ReactNode;
    chain: ChainTicker;
    network: ChainAdapterNetwork;
    wallets?: (WebWallet | ChainWallet)[];
    autoConnect?: boolean;
    onError?: (error: WalletError) => void;
    localStorageKey?: string;
    location: Location;
    onNavigate: (url: string) => void;
    indexDb: IndexDbAppDatabase;
}

export const WalletProviders: React.FC<WalletProps> = ({
    children, chain, network, location, onNavigate, indexDb
}: WalletProps) => {
    const { setAdapterConfig } = useWalletAdapterConfig();

    const config: WebWalletAdapterConfig = useMemo(() => {
        return {
            name: 'WebWalet' as WalletName,
            chain,
            network,
        }
    }, [chain, network])

    useEffect(() => {
        console.debug(`Wallet Providers config: ${JSON.stringify(config)}`)
        setAdapterConfig(config);
    }, [config])

    const { setIndexDb } = useIndexDb();

    useEffect(() => {
        setIndexDb(indexDb)
    }, [indexDb])

    const adapters = useMemo(() => initializeAdapters(config, indexDb), [config, indexDb])

    const solanaAdapters = useMemo(() => adapters.filter((adapter) =>
        validSolanaAdapterNames.includes(adapter.name)
    ) as SolanaAdapter[], [adapters])

    return (
        <SolanaWalletProvider wallets={solanaAdapters}>
            <NearWalletProvider
                onNavigate={onNavigate}>
                <NearBrowserWalletProvider
                    location={location}
                    onNavigate={onNavigate}
                >
                    {children}
                </NearBrowserWalletProvider>
            </NearWalletProvider>
        </SolanaWalletProvider>
    );
};
