import { useState } from 'react';
import type { ChainTicker, WalletName } from '@mindblox-wallet-adapter/base';
import { DEFAULT_TICKER } from '@mindblox-wallet-adapter/base';
import type { SelectedWallet } from '../store';
import { ChainAdapterNetwork } from '@mindblox-wallet-adapter/networks';
import type { WebWalletAdapterConfig } from '../adapter';

export const useShareableWalletConnectedState = () => {
    const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
    console.debug(`>>> Setting wallet connection state: ${isWalletConnected}`);
    return {
        isWalletConnected,
        setIsWalletConnected,
    };
};

export const useShareableSelectedTickerState = () => {
    const [selectedTicker, setSelectedTicker] = useState<ChainTicker>(DEFAULT_TICKER);
    console.debug(`>>> Setting selected ticker state: ${selectedTicker}`);
    return {
        selectedTicker,
        setSelectedTicker,
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

export const useShareableSelectedWalletNameState = () => {
    const [selectedWalletName, setSelectedWalletName] = useState<WalletName>();
    console.debug(`>>> Setting selected wallet name state: ${selectedWalletName}`);
    return {
        selectedWalletName,
        setSelectedWalletName,
    };
};

export const useShareableWalletAdapterConfig = () => {
    const [adapterConfig, setAdapterConfig] = useState<WebWalletAdapterConfig>({
        name: null,
        chain: null,
        network: null,
    });

    console.debug(`>>> Setting wallet adapter configstate: ${adapterConfig}`);
    return {
        adapterConfig,
        setAdapterConfig,
    };
};
