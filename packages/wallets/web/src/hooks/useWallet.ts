import { ChainTickers, WalletError } from '@mindblox-wallet-adapter/base';
import type { ChainWalletContextState, ChainAdapter, ChainWallet
} from '@mindblox-wallet-adapter/networks';
import {
    useSolanaWallet, useNearWallet
} from '@mindblox-wallet-adapter/networks';
import type { WebWalletAdapter } from '../wallet';
import type { WebWallet } from '../wallet';

import { useWalletAdapterConfig } from './useSharedStates';

interface WebWalletAdapterExtension {
    adapter: WebWalletAdapter;
    wallet: WebWallet;
    wallets: WebWallet[];
}

interface ChainAdapterExtension {
    adapter: ChainAdapter;
    wallet: ChainWallet;
    wallets: ChainWallet[]
}

type WebWalletContextState = ChainWalletContextState & WebWalletAdapterExtension & ChainAdapterExtension;


export const useWallet = <T extends WebWalletContextState>(): WebWalletContextState => {
    const { adapterConfig } = useWalletAdapterConfig();
    switch (adapterConfig.chain) {
        case ChainTickers.SOL:
            return useSolanaWallet() as T;
        case ChainTickers.NEAR:
            return useNearWallet() as T;
        default:
            throw new WalletError(`useWallet: Invalid chain ticker '${adapterConfig.chain}'!`);
    }
};
