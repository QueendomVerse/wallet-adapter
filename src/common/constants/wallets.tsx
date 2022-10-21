import { WalletName } from "../contexts/connection/networks/core/base";
import { ChainTickers, ChainNetworks } from "../contexts/connection/chains";

export const DEFAULT_CHAIN = ChainNetworks.NEAR;
export const DEFAULT_TICKER = ChainTickers.NEAR;
export const DEFAULT_WALLET_LABEL = "primary";
export const MIN_PASSWORD_LENGTH = 8;

export const BROWSER_WALLET_NAMES: WalletName[] = [
  "NearBrowserWallet" as WalletName,
];

export const DEFAULT_WALLET = {
  chain: ChainNetworks.NEAR,
  label: "secondary",
};
