import { PhantomWalletAdapter } from '@wallets';
import { ChainNetworks } from '../chains';
import { BrowserWalletAdapter as NearBrowserWalletAdapter } from '../networks/near';

import { getChainProp } from './tickers';
// import { NearIcon } from '../../contexts/wallet/near/view/icon/near';
// import { NearMaskIcon } from '../../contexts/wallet/near/view/icon/nearMask';

const phatomWalletAdapter = new PhantomWalletAdapter();
// const nearWalletAdapter = new NearBrowserWalletAdapter();

export const getWalletIcon = (chain: string | undefined) => {
    console.warn('func: getWalletIcon', chain);

    if (!chain) return;
    console.debug(`getting icon for '${chain}'.`);

    const params = getChainProp(chain);

    switch (chain) {
        // case ChainNetworks.NEAR: return nearWalletAdapter?.icon
        case ChainNetworks.SOL:
            return params.logoPath;
        case 'SolanaPrimaryWebWallet':
            return params.logoPath;
        case 'SolanaSecondaryWebWallet':
            return params.logoPath;
        // case 'NearSecondaryWebWallet': return nearWalletAdapter?.icon
        // case 'NearBrowserWallet': return nearWalletAdapter?.icon
        case 'Phantom':
            return phatomWalletAdapter?.icon;
    }
};
