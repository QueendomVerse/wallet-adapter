import type { Chain, WalletName } from '@mindblox-wallet-adapter/base';
import { ChainNetworks, getChainProp, DEFAULT_CHAIN } from '@mindblox-wallet-adapter/base';

const iconMap = {
    // [ChainNetworks.NEAR]: NearIcon,
    // [ChainNetworks.NEAR]: NearMaskIcon,
    [ChainNetworks.SOL]: getChainProp(ChainNetworks.SOL).logoPath,
    ['SolanaPrimaryWebWallet']: getChainProp(ChainNetworks.SOL).logoPath,
    ['SolanaSecondaryWebWallet']: getChainProp(ChainNetworks.SOL).logoPath,
    // ['NearSecondaryWebWallet']: nearWalletAdapter?.logoPath,
    // ['PhantomWallet']: phatomWalletAdapter?.icon,
};

export const getWalletIcon = (chain: Chain | WalletName | string | undefined) => {
    console.warn('func: getWalletIcon', chain);

    if (!chain) return;
    console.debug(`getting icon for '${chain}'`);

    const wantedIcon = iconMap[chain] || getChainProp(DEFAULT_CHAIN).logoPath;

    console.debug(`found icon for '${chain}'`, wantedIcon);

    return wantedIcon;
};
