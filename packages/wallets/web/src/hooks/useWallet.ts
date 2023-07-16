import { ChainTickers, WalletError } from '@mindblox-wallet-adapter/base';
import type { NearWallet } from '@mindblox-wallet-adapter/near';
import type { SolanaWalletContextState, NearWalletContextState } from '@mindblox-wallet-adapter/networks';
import { useSolanaWallet, useNearWallet } from '@mindblox-wallet-adapter/networks';
import type { SolanaWallet } from '@mindblox-wallet-adapter/solana';

import { useTickerState } from './useSharedStates';

export type WalletContextState = SolanaWalletContextState | NearWalletContextState;
export type Wallet = SolanaWallet | NearWallet;

export const useWallet = <T extends WalletContextState>(): WalletContextState => {
    const { selectedTicker } = useTickerState();
    switch (selectedTicker) {
        case ChainTickers.SOL:
            return useSolanaWallet() as T;
        case ChainTickers.NEAR:
            return useNearWallet() as T;
        default:
            throw new WalletError(`useWallet: Invalid chain ticker '${selectedTicker}'!`);
    }
};
