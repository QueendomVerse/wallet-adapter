import { useMemo } from 'react';
// import { clusterApiUrl } from '@solana/web3.js';
import * as dotenv from 'dotenv';

import type { WalletAdapterNetwork } from '@mindblox-wallet-adapter/base';
import { PhantomWalletAdapter } from '@mindblox-wallet-adapter/phantom';
import { WebWalletAdapter } from './adapter';
import { BrowserWalletAdapter as NearBrowserWalletAdapter } from './networks/near';
import { getAdapterNetwork } from './networks/solana';
import { clusterApiUrl } from '@solana/web3.js';
import { getSolanaNetwork } from './networks';

dotenv.config();

export const initializeWallets = () => {
    const network: WalletAdapterNetwork = getAdapterNetwork(process.env.NEXT_PUBLIC_SOLANA_NETWORK);
    console.info(`walletProvider.rpc network: ${getSolanaNetwork(process.env.NEXT_PUBLIC_SOLANA_NETWORK)}`);
    const nodeUri = clusterApiUrl(network);
    console.info(`walletProvider.rpc node: ${nodeUri}`);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new WebWalletAdapter(nodeUri ? { node: nodeUri } : { network }),
            new NearBrowserWalletAdapter(),
        ],
        [network]
    );
    // console.debug("Setup Wallets:")
    // console.dir(wallets);
    return wallets;
};
