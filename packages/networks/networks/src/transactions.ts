import type {
    SolanaTransaction,
    SolanaTransactionSignature as SolanaTransactionSignatureResult,
    SolanaCommitment,
    // SolanaKeypair,
    // SolanaTransactionInstruction,
    SendTransactionsWithManualRetryParams as SendSolanaTransactionsWithManualRetryParamsSolana,
    SendTransactionsInChunksParams as SendSolanaTransactionsInChunksParamsSolana,
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

export type Transaction = SolanaTransaction | NearTransaction;
export type TransactionResult = SolanaTransactionResult | NearTransactionResult;
export type Commitment = SolanaCommitment | NearCommitment;
export type SimulationResult = SolanaSimulationResult | NearSimulationResult;
export type SendTransactionsWithManualRetryParams = SendSolanaTransactionsWithManualRetryParamsSolana;
export type SendTransactionsInChunksParams = SendSolanaTransactionsInChunksParamsSolana;
export type SendTransactionsParams = SendSolanaTransactionsParams;
export type SendTransactionsWithRecentBlockParams = SendSolanaTransactionsWithRecentBlockParams;
export type SendTransactionWithRetryParams = SendSolanaTransactionWithRetryParams;
export type SendTransactionParams = SendSolanaTransactionParams;
export type SimulateTransactionParams = SimulateSolanaTransactionParams;
export type SendSignedTransactionParams = SendSolanaSignedTransactionParams;
export type AwaitTransactionSignatureConfirmationParams = AwaitSolanaTransactionSignatureConfirmationParams;
export type SignatureStatusResult = SolanaTransactionSignatureResult;

export const sendTransactionsWithManualRetry = async <T extends SendTransactionsWithManualRetryParams>(params: T) => {
    switch (params.wallet.chain) {
        case 'solana':
            return await sendSolanaTransactionsWithManualRetry(params);
        case 'near':
            throw new Error(`sendTransactionsWithManualRetry not implemented for ${params.wallet.chain} chain`);
        default:
            throw new Error(`sendTransactionsWithManualRetry invalid chain ${params.wallet.chain}`);
    }
};

export const sendTransactionsInChunks = async <T extends SendTransactionsInChunksParams>(
    params: T
): Promise<number> => {
    switch (params.wallet.chain) {
        case 'solana':
            return await sendSolanaTransactionsInChunks(params);
        case 'near':
            throw new Error(`sendTransactionsInChunks not implemented for ${params.wallet.chain} chain`);
        default:
            throw new Error(`sendTransactionsInChunks invalid chain ${params.wallet.chain}`);
    }
};

export const sendTransactions = async <T extends SendTransactionsParams>(params: T): Promise<number> => {
    switch (params.wallet.chain) {
        case 'solana':
            return await sendSolanaTransactions(params);
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

export const sendTransaction = async <T extends SendTransactionParams>(params: T): Promise<TransactionResult> => {
    switch (params.wallet.chain) {
        case 'solana':
            return await sendSolanaTransaction(params);
        case 'near':
            throw new Error(`sendTransaction not implemented for ${params.wallet.chain} chain`);
        default:
            throw new Error(`sendTransaction invalid chain ${params.wallet.chain}`);
    }
};

export const sendTransactionWithRetry = async <T extends SendTransactionWithRetryParams>(params: T) => {
    switch (params.wallet.chain) {
        case 'solana':
            return await sendSolanaTransactionWithRetry(params);
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

export const simulateTransaction = async <T extends SimulateTransactionParams>(
    params: T
): Promise<SimulationResult> => {
    switch (params.connection.chain) {
        case 'solana':
            return await simulateSolanaTransaction(params);
        case 'near':
            throw new Error(`simulateTransaction not implemented for ${params.connection.chain} chain`);
        default:
            throw new Error(`simulateTransaction invalid chain ${params.connection.chain}`);
    }
};

export const awaitTransactionSignatureConfirmation = async <T extends AwaitTransactionSignatureConfirmationParams>(
    params: T
): Promise<void | SolanaSignatureConfirmationResult | null> => {
    switch (params.connection.chain) {
        case 'solana':
            return awaitSolanaTransactionSignatureConfirmation(params);
        case 'near':
            throw new Error(
                `awaitTransactionSignatureConfirmation not implemented for ${params.connection.chain} chain`
            );
        default:
            throw new Error(`awaitTransactionSignatureConfirmation invalid chain ${params.connection.chain}`);
    }
};
