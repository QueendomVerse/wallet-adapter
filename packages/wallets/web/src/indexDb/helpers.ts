import type { LocalWalletStore } from '@mindblox-wallet-adapter/base';
import type { IndexDbWallet } from './db';

export const getValidWallets = (wallets: (LocalWalletStore | undefined)[]) => {
    return wallets.filter((w): w is LocalWalletStore => !!w);
};

export const getValidDbWallets = (wallets: (IndexDbWallet | undefined)[]) => {
    return wallets.filter((w): w is IndexDbWallet => !!w);
};

export const getPrimaryWallet = (wallets: LocalWalletStore[]) => {
    return wallets.find((w) => w.label === 'primary');
};
