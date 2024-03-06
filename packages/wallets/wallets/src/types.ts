import type {
    Adapter,
    ChainConnection,
    ChainPublicKey,
    ChainTransaction,
    ChainTransactionSignature,
    WalletAdapter,
} from '@mindblox-wallet-adapter/base';
import { PhantomWalletAdapter } from '@mindblox-wallet-adapter/phantom';
import { WebWalletAdapter } from '@mindblox-wallet-adapter/web';
import {
    BrowserWalletAdapter as NearBrowserWalletAdapter,
    NearAdapter
} from '@mindblox-wallet-adapter/near';
import { SolanaAdapter } from '@mindblox-wallet-adapter/solana';

export type ExtendedAdapter =
    | WebWalletAdapter
    | NearBrowserWalletAdapter
    | PhantomWalletAdapter
    | SolanaAdapter
    | NearAdapter
    | WalletAdapter<ChainPublicKey, ChainTransaction, ChainConnection, ChainTransactionSignature>;
