import type {
    Adapter,
    ChainConnection,
    ChainPublicKey,
    ChainTransaction,
    ChainTransactionSignature,
} from '@mindblox-wallet-adapter/base';
// import type { PhantomWalletAdapter } from '@mindblox-wallet-adapter/phantom';
// import {
//     NearBrowserWalletAdapter, WebWalletAdapter
// } from '@mindblox-wallet-adapter/web';

export type ExtendedAdapter =
    // | WebWalletAdapter
    // | NearBrowserWalletAdapter
    // | PhantomWalletAdapter
    // | SolanaAdapter
    // | NearAdapter
    Adapter<ChainPublicKey, ChainTransaction, ChainConnection, ChainTransactionSignature>;
