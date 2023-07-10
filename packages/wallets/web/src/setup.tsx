import { useMemo } from 'react';
// import { clusterApiUrl } from '@solana/web3.js';
import * as dotenv from 'dotenv';

import type { WalletAdapterNetwork } from '@base';
import { PhantomWalletAdapter } from '@wallets';
import { WebWalletAdapter } from './adapter';
import { BrowserWalletAdapter as NearBrowserWalletAdapter } from './networks/near';
import { getAdapterNetwork } from './networks/solana';
import { clusterApiUrl } from '@solana/web3.js';

dotenv.config();

const getNetwork = (net?: string) => {
    return net != 'localnet' ? getAdapterNetwork(net) : net;
};

export const initializeWallets = () => {
    const network: WalletAdapterNetwork = getAdapterNetwork(process.env.NEXT_PUBLIC_SOLANA_NETWORK);
    console.info(`walletProvider.rpc network: ${getNetwork(process.env.NEXT_PUBLIC_SOLANA_NETWORK)}`);
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
