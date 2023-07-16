import type { WalletName } from './adapter';
import type { ChainTicker } from './chains';
import { ChainTickers } from './chains';
import { getTickerProp } from './utils/tickers';

export type WalletLabel = 'primary' | 'secondary';

export const DEFAULT_TICKER = ChainTickers.SOL as ChainTicker;
export const DEFAULT_CHAIN = getTickerProp(DEFAULT_TICKER).network;
export const DEFAULT_WALLET_LABEL = 'primary' as WalletLabel;

export const BROWSER_WALLET_NAMES: WalletName[] = ['Phantom' as WalletName, 'NearBrowserWallet' as WalletName];

export const DEFAULT_WALLET = {
    chain: DEFAULT_CHAIN,
    label: DEFAULT_WALLET_LABEL,
};
