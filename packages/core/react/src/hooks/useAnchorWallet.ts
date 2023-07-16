import type { ChainPublicKey, ChainTransaction } from '@mindblox-wallet-adapter/base';
import { useMemo } from 'react';
import { useWallet } from './useWallet';

export interface AnchorWallet {
    publicKey: ChainPublicKey;
    signTransaction(transaction: ChainTransaction): Promise<ChainTransaction>;
    signAllTransactions(transactions: ChainTransaction[]): Promise<ChainTransaction[]>;
}

export const useAnchorWallet = (): AnchorWallet | undefined => {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    return useMemo(
        () =>
            publicKey && signTransaction && signAllTransactions
                ? { publicKey, signTransaction, signAllTransactions }
                : undefined,
        [publicKey, signTransaction, signAllTransactions]
    );
};
