import { useState } from 'react';
import type { WalletName } from '@mindblox-wallet-adapter/base';
import { DEFAULT_TICKER } from '@mindblox-wallet-adapter/base';
import type { SelectedWallet } from '../store';
import type { WebWalletAdapterConfig } from '../wallet';
import { DEFAULT_NETWORK } from '../constants';
import { getAdapterNetwork } from '@mindblox-wallet-adapter/networks';
import type { IndexDbAppDatabase } from '../indexDb';

export const useShareableWalletConnectedState = () => {
    const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
    console.debug(`>>> Setting wallet connection state: ${isWalletConnected}`);
    return {
        isWalletConnected,
        setIsWalletConnected,
    };
};

export const useShareableSelectedWalletState = () => {
    const [selectedWallet, setSelectedWallet] = useState<SelectedWallet>();
    const display = `${selectedWallet?.name} = ${selectedWallet?.wallet.chain} ${selectedWallet?.wallet.label}`;
    console.debug(`>>> Setting selected wallet state: ${display}`);
    return {
        selectedWallet,
        setSelectedWallet,
    };
};

export const useShareableIsWalletBrowserState = () => {
    const [isBrowserWallet, setIsBrowserWallet] = useState<boolean>();
    console.debug(`>>> Setting is browser wallet state as: ${isBrowserWallet}`);
    return {
        isBrowserWallet,
        setIsBrowserWallet,
    };
};

export const useShareableBalanceState = () => {
    const [balance, setBalance] = useState<number>(-1);
    console.debug(`>>> Setting balance state: ${balance}`);
    return {
        balance,
        setBalance,
    };
};

export const useShareableWalletAdapterConfig = () => {
    
    const [adapterConfig, setAdapterConfig] = useState<WebWalletAdapterConfig>({
        name: 'WebWallet' as WalletName,
        chain: DEFAULT_TICKER,
        network: getAdapterNetwork(DEFAULT_TICKER,DEFAULT_NETWORK),
    });

    console.debug(`>>> Setting wallet adapter configstate: ${JSON.stringify(adapterConfig)}`);
    return {
        adapterConfig,
        setAdapterConfig,
    };
};

export const useShareableIndexDb = () => {
    const [indexDb, setIndexDb] = useState<IndexDbAppDatabase>();
    console.debug(`>>> Setting Index Db ...`);
    return {
        indexDb,
        setIndexDb
    }
}