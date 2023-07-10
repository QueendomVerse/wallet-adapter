import { WalletError } from '@wallet-adapter/base';

export class WalletNotSelectedError extends WalletError {
    name = 'WalletNotSelectedError';
}
