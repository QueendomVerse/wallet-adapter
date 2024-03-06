import { WalletName } from 'common/contexts/connection/networks/core/base';

import { Wallet as DbWallet } from '../localDB/db';
import { KeyPair as lKeypair } from '../store/types/webWalletTypes';


export interface SelectedWallet {
  name: WalletName;
  wallet: DbWallet;
  keypair: lKeypair;
}