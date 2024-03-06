import { NearAdapter, NearWalletSigner } from '@mindblox-wallet-adapter/near';
import { SolanaAdapter } from '@mindblox-wallet-adapter/solana';
import type {
    SolanaConnectionContextState,
    NearConnectionContextState,
    NearWalletContextState,
    SolanaWalletContextState,
    NearWallet,
    SolanaWallet,
    SolanaWalletSigner
} from '..';

// Context States
export type ChainConnectionContextState = SolanaConnectionContextState | NearConnectionContextState;

export type ChainConnectionContextStateMap = {
    SOL: SolanaConnectionContextState;
    NEAR: NearConnectionContextState;
};

export type ChainWallet =
    | SolanaWallet
    | NearWallet;

export type UnionWallet =
    & SolanaWallet
    & NearWallet;

export type ChainWalletContextState =
    | NearWalletContextState
    | SolanaWalletContextState;

export type UnionWalletContextState =
    & NearWalletContextState
    & SolanaWalletContextState;

export type ChainAdapter =
    | SolanaAdapter
    | NearAdapter;

export type UnionAdapter =
    & SolanaAdapter
    & NearAdapter;

export type ChainWalletSigner =
    | SolanaWalletSigner
    | NearWalletSigner

export type UnionWalletSigner =
    & SolanaWalletSigner
    & NearWalletSigner