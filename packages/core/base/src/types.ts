import type { WalletAdapter } from './adapter';
import type { MessageSignerWalletAdapter, SignerWalletAdapter } from './signer';
import type { WebWalletAdapter } from '@web';

export type Adapter = WalletAdapter | WebWalletAdapter | SignerWalletAdapter | MessageSignerWalletAdapter;

export enum WalletAdapterNetwork {
    Mainnet = 'mainnet-beta',
    Testnet = 'testnet',
    Devnet = 'devnet',
}

// WalletName is a nominal type that wallet adapters should use, e.g. `'MyCryptoWallet' as WalletName<'MyCryptoWallet'>`
// https://medium.com/@KevinBGreene/surviving-the-typescript-ecosystem-branding-and-type-tagging-6cf6e516523d
export type WalletName<T extends string = string> = T & { __brand__: 'WalletName' };
