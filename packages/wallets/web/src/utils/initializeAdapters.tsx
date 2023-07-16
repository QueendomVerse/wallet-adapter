import { useMemo } from 'react';

import { PhantomWalletAdapter } from '@mindblox-wallet-adapter/phantom';
import { NearBrowserWalletAdapter } from '@mindblox-wallet-adapter/networks';

import type { WebWalletAdapterConfig } from '../adapter';
import { WebWalletAdapter } from '../adapter';

export const initializeAdapters = (config: WebWalletAdapterConfig) => {
    const adapters = useMemo(
        () => [new PhantomWalletAdapter(), new WebWalletAdapter(config), new NearBrowserWalletAdapter()],
        [config]
    );
    return adapters;
};
