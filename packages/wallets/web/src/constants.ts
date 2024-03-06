import type { Chain, ChainTicker, WalletName } from '@mindblox-wallet-adapter/base';
import { ChainNetworks, ChainTickers, getTickerProp } from '@mindblox-wallet-adapter/base';
import { ChainAdapterNetworks, CommonAdapterNetwork } from '@mindblox-wallet-adapter/networks';

export const DEFAULT_TICKER = ChainTickers.SOL as ChainTicker;
export const DEFAULT_CHAIN = getTickerProp(DEFAULT_TICKER).network as Chain;
export const DEFAULT_NETWORK = ChainAdapterNetworks.Devnet as CommonAdapterNetwork;
export const DEFAULT_WALLET_LABEL = 'primary';
export const MIN_PASSWORD_LENGTH = 8;

export const BROWSER_WALLET_NAMES: WalletName[] = ['Phantom' as WalletName, 'NearBrowserWallet' as WalletName];

export const DEFAULT_WALLET = {
    chain: ChainNetworks.SOL,
    label: 'primary', // 'secondary'
};
