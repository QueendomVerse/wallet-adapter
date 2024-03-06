import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

import {
  ChainNetworks
} from 'common/contexts/connection/chains';
// import { 
//   BrowserWalletAdapter as NearBrowserWalletAdapter
// } from 'common/contexts/connection/networks/near/BrowserWalletAdapter';

import { getChainProp } from '../../utils/wallets';
// import { NearIcon } from '../../contexts/wallet/near/view/icon/near';
// import { NearMaskIcon } from '../../contexts/wallet/near/view/icon/nearMask';

const phatomWalletAdapter = new PhantomWalletAdapter();
// const nearWalletAdapter = new NearBrowserWalletAdapter();

export const getWalletIcon = (chain: string | undefined) => {
  console.warn('func: getWalletIcon', chain)

  if (!chain) return;
  console.debug(`getting icon for '${chain}'.`);
  
  const params =  getChainProp(chain)

  switch(chain) {
    // case ChainNetworks.NEAR: return nearWalletAdapter?.icon
    case ChainNetworks.SOL: return params.logoPath
    case 'SolanaPrimaryWebWallet': return params.logoPath
    case 'SolanaSecondaryWebWallet': return params.logoPath
    // case 'NearSecondaryWebWallet': return nearWalletAdapter?.icon
    // case 'NearBrowserWallet': return nearWalletAdapter?.icon
    case 'Phantom': return phatomWalletAdapter?.icon
  }
};