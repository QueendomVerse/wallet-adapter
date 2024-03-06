import type {
    SolanaTransaction,
    SolanaTransactionSignature as SolanaTransactionSignatureResult,
    SolanaCommitment,
    // SolanaKeypair,
    // SolanaTransactionInstruction,
    SendTransactionsWithManualRetryParams as SendSolanaTransactionsWithManualRetryParams,
    SendTransactionsInChunksParams as SendSolanaTransactionsInChunksParams,
    SimulationResult as SolanaSimulationResult,
    SendTransactionsWithRecentBlockParams as SendSolanaTransactionsWithRecentBlockParams,
    SendTransactionsParams as SendSolanaTransactionsParams,
    SendTransactionWithRetryParams as SendSolanaTransactionWithRetryParams,
    SendTransactionParams as SendSolanaTransactionParams,
    SimulateTransactionParams as SimulateSolanaTransactionParams,
    TransactionResult as SolanaTransactionResult,
    SendSignedTransactionParams as SendSolanaSignedTransactionParams,
    AwaitTransactionSignatureConfirmationParams as AwaitSolanaTransactionSignatureConfirmationParams,
    SignatureConfirmationResult as SolanaSignatureConfirmationResult,
} from '@mindblox-wallet-adapter/solana';
import {
    sendTransactionsInChunks as sendSolanaTransactionsInChunks,
    sendTransaction as sendSolanaTransaction,
    sendTransactions as sendSolanaTransactions,
    sendTransactionWithRetry as sendSolanaTransactionWithRetry,
    sendTransactionsWithManualRetry as sendSolanaTransactionsWithManualRetry,
    sendTransactionsWithRecentBlock as sendSolanaTransactionsWithRecentBlock,
    sendSignedTransaction as sendSolanaSignedTransaction,
    simulateTransaction as simulateSolanaTransaction,
    awaitTransactionSignatureConfirmation as awaitSolanaTransactionSignatureConfirmation,
} from '@mindblox-wallet-adapter/solana';
import type { NearTransaction } from '@mindblox-wallet-adapter/near';
import type {
    Commitment as NearCommitment,
    SimulationResult as NearSimulationResult,
    TransactionResult as NearTransactionResult,
} from '@mindblox-wallet-adapter/near';
import { ChainConnection } from '@mindblox-wallet-adapter/base';
import { ChainWalletContextState } from './types';

export type Transaction = SolanaTransaction | NearTransaction;
export type TransactionResult = SolanaTransactionResult | NearTransactionResult;
export type Commitment = SolanaCommitment | NearCommitment;
export type SimulationResult = SolanaSimulationResult | NearSimulationResult;

export interface SendTransactionsWithManualRetryParams<C extends ChainConnection, W extends ChainWalletContextState> extends Omit<
SendSolanaTransactionsWithManualRetryParams, 'connection' | 'wallet'
    >{
    connection: C;
    wallet: W;
}

export interface SendTransactionsInChunksParams<C extends ChainConnection, W extends ChainWalletContextState> extends Omit<
SendSolanaTransactionsInChunksParams, 'connection' | 'wallet'
    >{
    connection: C;
    wallet: W;
}


export interface SendTransactionsParams<C extends ChainConnection, W extends ChainWalletContextState> extends Omit<
    SendSolanaTransactionsParams, 'connection' | 'wallet'
>{
    connection: C;
    wallet: W;
}

export type SendTransactionsWithRecentBlockParams = SendSolanaTransactionsWithRecentBlockParams;

// export type SendTransactionWithRetryParams = SendSolanaTransactionWithRetryParams;
export interface SendTransactionWithRetryParams<C extends ChainConnection, W extends ChainWalletContextState> extends Omit<
SendSolanaTransactionWithRetryParams, 'connection' | 'wallet'
    >{
    connection: C;
    wallet: W;
}

export interface SendTransactionParams<C extends ChainConnection, W extends ChainWalletContextState> extends Omit<
    SendSolanaTransactionParams, 'connection' | 'wallet'
    >{
    connection: C;
    wallet: W;
}

export interface SimulateTransactionParams<C extends ChainConnection, W extends ChainWalletContextState> extends Omit<
SimulateSolanaTransactionParams, 'connection' | 'wallet'
    >{
    connection: C;
    wallet: W;
}

export interface SendSignedTransactionParams<C extends ChainConnection, W extends ChainWalletContextState> extends Omit<
SendSolanaSignedTransactionParams, 'connection' | 'wallet'
    >{
    connection: C;
    wallet: W;
}

export interface AwaitTransactionSignatureConfirmationParams<C extends ChainConnection, W extends ChainWalletContextState> extends Omit<
AwaitSolanaTransactionSignatureConfirmationParams, 'connection' | 'wallet'
    >{
    connection: C;
    wallet: W;
}

export interface SignatureStatusResult<C extends ChainConnection, W extends ChainWalletContextState> extends Omit<
SolanaTransactionSignatureResult, 'connection' | 'wallet'
    >{
    connection: C;
    wallet: W;
}

export const sendTransactionsWithManualRetry = async <
    C extends ChainConnection,
    W extends ChainWalletContextState,
    T extends SendTransactionsWithManualRetryParams<C, W>
>(params: T) => {
    switch (params.wallet.chain) {
        case 'solana':
            return await sendSolanaTransactionsWithManualRetry(params as SendSolanaTransactionsWithManualRetryParams);
        case 'near':
            throw new Error(`sendTransactionsWithManualRetry not implemented for ${params.wallet.chain} chain`);
        default:
            throw new Error(`sendTransactionsWithManualRetry invalid chain ${params.wallet.chain}`);
    }
};

export const sendTransactionsInChunks = async <
    C extends ChainConnection,
    W extends ChainWalletContextState,
    T extends SendTransactionsInChunksParams<C, W>
>(params: T): Promise<number> => {
    switch (params.wallet.chain) {
        case 'solana':
            return await sendSolanaTransactionsInChunks(params as SendSolanaTransactionsInChunksParams);
        case 'near':
            throw new Error(`sendTransactionsInChunks not implemented for ${params.wallet.chain} chain`);
        default:
            throw new Error(`sendTransactionsInChunks invalid chain ${params.wallet.chain}`);
    }
};

export const sendTransactions = async <
    C extends ChainConnection,
    W extends ChainWalletContextState,
    T extends SendTransactionsParams<C, W>
>(params: T): Promise<number> => {
    switch (params.wallet.chain) {
        case 'solana':
            return await sendSolanaTransactions(params as SendSolanaTransactionsParams);
        case 'near':
            throw new Error(`sendTransactions not implemented for ${params.wallet.chain} chain`);
        default:
            throw new Error(`sendTransactions invalid chain ${params.wallet.chain}`);
    }
};

export const sendTransactionsWithRecentBlock = async <T extends SendTransactionsWithRecentBlockParams>(
    params: T
): Promise<number> => {
    switch (params.wallet.chain) {
        case 'solana':
            return await sendSolanaTransactionsWithRecentBlock(params);
        case 'near':
            throw new Error(`sendTransactionsWithRecentBlock not implemented for ${params.wallet.chain} chain`);
        default:
            throw new Error(`sendTransactionsWithRecentBlock invalid chain ${params.wallet.chain}`);
    }
};

export const sendTransaction = async <
    C extends ChainConnection,
    W extends ChainWalletContextState,
    T extends SendTransactionParams<C, W>
>(params: T): Promise<TransactionResult> => {
    switch (params.wallet.chain) {
        case 'solana':
            return await sendSolanaTransaction(params as SendSolanaTransactionParams);
        case 'near':
            throw new Error(`sendTransaction not implemented for ${params.wallet.chain} chain`);
        default:
            throw new Error(`sendTransaction invalid chain ${params.wallet.chain}`);
    }
};

export const sendTransactionWithRetry = async <
    C extends ChainConnection,
    W extends ChainWalletContextState,
    T extends SendTransactionWithRetryParams<C, W>
>(params: T) => {
    switch (params.wallet.chain) {
        case 'solana':
            return await sendSolanaTransactionWithRetry(params as SendSolanaTransactionWithRetryParams);
        case 'near':
            throw new Error(`sendTransactionWithRetry not implemented for ${params.wallet.chain} chain`);
        default:
            throw new Error(`sendTransactionWithRetry invalid chain ${params.wallet.chain}`);
    }
};

export const sendSignedTransaction = async <T extends SendSolanaSignedTransactionParams>(
    params: T
): Promise<TransactionResult> => {
    switch (params.connection.chain) {
        case 'solana':
            return await sendSolanaSignedTransaction(params);
        case 'near':
            throw new Error(`sendSignedTransaction not implemented for ${params.connection.chain} chain`);
        default:
            throw new Error(`sendSignedTransaction invalid chain ${params.connection.chain}`);
    }
};

export const simulateTransaction = async <
    C extends ChainConnection,
    W extends ChainWalletContextState,
    T extends SimulateTransactionParams<C, W>
>(params: T): Promise<SimulationResult> => {
    switch (params.connection.chain) {
        case 'solana':
            return await simulateSolanaTransaction(params as SimulateSolanaTransactionParams);
        case 'near':
            throw new Error(`simulateTransaction not implemented for ${params.connection.chain} chain`);
        default:
            throw new Error(`simulateTransaction invalid chain ${params.connection.chain}`);
    }
};

export const awaitTransactionSignatureConfirmation = async <
    C extends ChainConnection,
    W extends ChainWalletContextState,
    T extends AwaitTransactionSignatureConfirmationParams<C, W>
>(params: T): Promise<void | SolanaSignatureConfirmationResult | null> => {
    switch (params.connection.chain) {
        case 'solana':
            return awaitSolanaTransactionSignatureConfirmation(params as AwaitSolanaTransactionSignatureConfirmationParams);
        case 'near':
            throw new Error(`awaitTransactionSignatureConfirmation not implemented for ${params.connection.chain} chain`);
        default:
            throw new Error(`awaitTransactionSignatureConfirmation invalid chain ${params.connection.chain}`);
    }
};