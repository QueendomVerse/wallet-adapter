import type { LocalKeypairStore, WalletName } from '@mindblox-wallet-adapter/base';

import type { IndexDbWallet } from '../../indexDb';

export interface SelectedWallet {
    name: WalletName;
    wallet: IndexDbWallet;
    keypair: LocalKeypairStore;
}
