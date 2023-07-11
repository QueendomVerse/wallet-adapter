import type { WalletName } from '@mindblox-wallet-adapter/base';

import type { IndexDbWallet } from '@/indexDb';
import type { LocalKeyPairStore } from '@/store';

export interface SelectedWallet {
    name: WalletName;
    wallet: IndexDbWallet;
    keypair: LocalKeyPairStore;
}
