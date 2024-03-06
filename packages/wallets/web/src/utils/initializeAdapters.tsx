import { PhantomWalletAdapter } from '@mindblox-wallet-adapter/phantom';
import { NearBrowserWalletAdapter } from '@mindblox-wallet-adapter/networks';

import type { WebWalletAdapterConfig } from '../wallet';
import { WebWalletAdapter } from '../wallet';
import type { IndexDbAppDatabase } from '../indexDb';

export const initializeAdapters = (config: WebWalletAdapterConfig, indexDb: IndexDbAppDatabase) => {
    return [
        new PhantomWalletAdapter(),
        new WebWalletAdapter(config, indexDb),
        new NearBrowserWalletAdapter()
    ]
};
