import type {
    NearConnection,
    NearConnectionConfig,
    NearKeypair,
    NearPublicKey,
    NearSendOptions,
    NearSigner,
    NearTransaction,
    NearTransactionSignature,
} from '../networks/near';
import type {
    SolanaConnection,
    SolanaConnectionConfig,
    SolanaKeypair,
    SolanaPublicKey,
    SolanaSendOptions,
    SolanaSigner,
    SolanaTransaction,
    SolanaTransactionSignature,
} from '../networks/solana';

// Connections
export type ChainConnection = SolanaConnection | NearConnection;

export type ChainConnectionMap = {
    SOL: SolanaConnection;
    NEAR: NearConnection;
};

export type UnionConnection = SolanaConnection & NearConnection;

// Public Keys
export type ChainPublicKey = SolanaPublicKey | NearPublicKey;

export type ChainPublicKeyMap = {
    SOL: SolanaPublicKey;
    NEAR: NearPublicKey;
};

export type UnionPublicKey = SolanaPublicKey & NearPublicKey;

export interface IPublicKey {
    toBase58: () => string;
}

// Key Pairs
export type ChainKeypair = SolanaKeypair | NearKeypair;

export type ChainKeypairMap = {
    SOL: SolanaKeypair;
    NEAR: NearKeypair;
};

export type UnionKeypair = SolanaKeypair & NearKeypair;

export interface IKeypair {
    publicKey: ChainPublicKey;
    secretKey: Uint8Array;
}

// Send Options
export type ChainSendOptions = SolanaSendOptions | NearSendOptions;

export type ChainSendOptionsMap = {
    SOL: SolanaSendOptions;
    NEAR: NearSendOptions;
};

export type UnionSendOptions = SolanaSendOptions & NearSendOptions;

/// Signers
export type ChainSigner = SolanaSigner | NearSigner;

export type ChainSignerMap = {
    SOL: SolanaSigner;
    NEAR: NearSigner;
};

export type UnionSigner = SolanaSigner & NearSigner;

// Transactions
export type ChainTransaction = SolanaTransaction | NearTransaction;

export type ChainTransactionMap = {
    SOL: SolanaTransaction;
    NEAR: NearTransaction;
};

export type UnionTransaction = SolanaTransaction & NearTransaction;

// Transaction Signatures
export type ChainTransactionSignature = SolanaTransactionSignature | NearTransactionSignature;

export type ChainTransactionSignatureMap = {
    SOL: SolanaTransactionSignature;
    NEAR: NearTransactionSignature;
};

export type UnionTransactionSignature = SolanaTransactionSignature & NearTransactionSignature;

// Connection Config
export type ChainConnectionConfig = SolanaConnectionConfig | NearConnectionConfig;

export type ChainConnectionConfigMap = {
    SOL: SolanaConnectionConfig;
    NEAR: NearConnectionConfig;
};

export type UnionConnectionConfig = SolanaConnectionConfig & NearConnectionConfig;
