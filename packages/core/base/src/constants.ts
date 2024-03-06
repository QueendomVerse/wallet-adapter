import type { WalletName } from './adapter';
import type { Chain, ChainTicker } from './chains';
import { ChainNetworks, ChainTickers} from './chains';

export type WalletLabel = 'primary' | 'secondary';

export const DEFAULT_TICKER = ChainTickers.SOL as ChainTicker;
export const DEFAULT_CHAIN = ChainNetworks.SOL as Chain;
export const DEFAULT_WALLET_LABEL = 'primary' as WalletLabel;

export const BROWSER_WALLET_NAMES: WalletName[] = ['Phantom' as WalletName, 'NearBrowserWallet' as WalletName];

export const DEFAULT_WALLET = {
    chain: DEFAULT_CHAIN,
    label: DEFAULT_WALLET_LABEL,
};
