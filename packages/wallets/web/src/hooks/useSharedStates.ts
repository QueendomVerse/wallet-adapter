import { useBetween } from 'use-between';
import {
    useShareableBalanceState,
    useShareableIndexDb,
    useShareableIsWalletBrowserState,
    useShareableSelectedWalletState,
    useShareableWalletAdapterConfig,
    useShareableWalletConnectedState,
} from '../contexts';

export const useWalletConnectedState = () => useBetween(useShareableWalletConnectedState);
// export const useTickerState = () => useBetween(useShareableSelectedTickerState);
export const useWalletState = () => useBetween(useShareableSelectedWalletState);
export const useBrowserWalletState = () => useBetween(useShareableIsWalletBrowserState);
export const useBalanceState = () => useBetween(useShareableBalanceState);
// export const useSelectedWalletNameState = () => useBetween(useShareableSelectedWalletNameState);
export const useWalletAdapterConfig = () => useBetween(useShareableWalletAdapterConfig);
export const useIndexDb = () => useBetween(useShareableIndexDb)