import { WalletError } from '@mindblox-wallet-adapter/base';

export class WalletNotSelectedError extends WalletError {
    name = 'WalletNotSelectedError';
}
