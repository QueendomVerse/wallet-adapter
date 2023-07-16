import type { ChainTicker } from '../chains';
import { ChainTickers } from '../chains';
import type { SolanaConnection, SolanaTransaction } from '../networks/solana';
import { getFeePayer as getSolanaFeePayer, getRecentBlockHash as getSolanaRecentBlockHash } from '../networks/solana';
import type { ChainTransactionMap, ChainConnectionMap } from '../types';

export const getFeePayer = <CT extends ChainTicker>(chain: CT, transaction: ChainTransactionMap[CT]) => {
    switch (chain) {
        case ChainTickers.SOL:
            return getSolanaFeePayer(transaction as SolanaTransaction);
        case ChainTickers.NEAR:
            throw new Error('Function getFeePayer Not yet implemented on Near');
        default:
            throw new Error(`Unable to get fee payer, invalid chain ${chain}`);
    }
};

export const getRecentBlockHash = <CT extends ChainTicker>(
    chain: CT,
    connection: ChainConnectionMap[CT],
    transaction: ChainTransactionMap[CT]
) => {
    switch (chain) {
        case ChainTickers.SOL:
            return getSolanaRecentBlockHash(connection as SolanaConnection, transaction as SolanaTransaction);
        case ChainTickers.NEAR:
            throw new Error('Function getRecentBlockHash Not yet implemented on Near');
        default:
            throw new Error(`Unable to get recent blockhash, invalid chain ${chain}`);
    }
};

export const signTransaction = <CT extends ChainTicker>(
    chain: CT,
    connection: ChainConnectionMap[CT],
    transaction: ChainTransactionMap[CT]
) => {
    switch (chain) {
        case ChainTickers.SOL:
            return getSolanaRecentBlockHash(connection as SolanaConnection, transaction as SolanaTransaction);
        case ChainTickers.NEAR:
            throw new Error('Function getRecentBlockHash Not yet implemented on Near');
        default:
            throw new Error(`Unable to get recent blockhash, invalid chain ${chain}`);
    }
};

export const sendTransaction = <CT extends ChainTicker>(
    chain: CT,
    connection: ChainConnectionMap[CT],
    transaction: ChainTransactionMap[CT]
) => {
    switch (chain) {
        case ChainTickers.SOL:
            return getSolanaRecentBlockHash(connection as SolanaConnection, transaction as SolanaTransaction);
        case ChainTickers.NEAR:
            throw new Error('Function getRecentBlockHash Not yet implemented on Near');
        default:
            throw new Error(`Unable to get recent blockhash, invalid chain ${chain}`);
    }
};
