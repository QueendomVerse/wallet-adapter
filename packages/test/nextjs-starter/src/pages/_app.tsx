import type { FC } from 'react';
import React, { useMemo } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';

import { WalletAdapterNetwork, solanaClusterApiUrl } from '@mindblox-wallet-adapter/solana';
import { ConnectionProvider, WalletProvider } from '@mindblox-wallet-adapter/react';
import { WalletModalProvider } from '@mindblox-wallet-adapter/react-ui';
import { UnsafeBurnerWalletAdapter } from '@mindblox-wallet-adapter/wallets';
import { ChainAdapterNetwork, NearWalletAdapterNetwork, SolanaWalletAdapterNetwork } from '@mindblox-wallet-adapter/networks';
import { ChainTickers, type SolanaConnection } from '@mindblox-wallet-adapter/base';
import { getAdapterCluster } from '@mindblox-wallet-adapter/solana';

import {
    ConnectionProviders,
    // getStore,
    // IndexDbAppDatabase,
    // WalletProviders,
  } from '@mindblox-wallet-adapter/web';

// Use require instead of import since order matters
require('@mindblox-wallet-adapter/react-ui/styles.css');
require('../styles/globals.css');

const App: FC<AppProps> = ({ Component, pageProps }) => {
    // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
    const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint
    const endpoint = useMemo(() => solanaClusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            /**
             * Wallets that implement either of these standards will be available automatically.
             *
             *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
             *     (https://github.com/solana-mobile/mobile-wallet-adapter)
             *   - Solana Wallet Standard
             *     (https://github.com/solana-labs/wallet-standard)
             *
             * If you wish to support a wallet that supports neither of those standards,
             * instantiate its legacy wallet adapter here. Common legacy adapters can be found
             * in the npm package `@solana/wallet-adapter-wallets`.
             */
            new UnsafeBurnerWalletAdapter(),
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [network]
    );

    // const webWalletStore = getStore();
    // const location = useLocation()
    // const router = useRouter();
      // Get the current pathname
    // const currentPath = router.pathname;

    // Navigate to a new page
    // const handleNavigation = () => {
    //     router.push('/new-page');
    // };

    // const { query } = router;

    // const navigate = useNavigate();
  
    // const indexDb = new IndexDbAppDatabase()

    return (
        <ConnectionProviders
            networks = {{
                solana: SolanaWalletAdapterNetwork.Devnet,
                near: NearWalletAdapterNetwork.Testnet
            }}
            // chain={ChainTickers.SOL}
            // connectionConstructor={SolanaConnection}
            // endpoint={network}
        >
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <Component {...pageProps} />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProviders>
    );
};

export default App;
