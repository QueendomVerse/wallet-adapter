import type { Connection, Commitment, SignatureResult } from '@solana/web3.js';
import type { StringPublicKey } from '@/networks';
import { SailGetMultipleTransactionsError, chunks } from '@/networks/solana';

export const GET_MULTIPLE_TRANSACTIONS_CHUNK_SIZE = 100; // or value you require

export const getMultipleTransactions = async (
    connection: Connection,
    keys: readonly StringPublicKey[],
    onError: (err: SailGetMultipleTransactionsError) => void,
    commitment: Commitment = 'confirmed'
): Promise<{
    keys: typeof keys;
    array: (SignatureResult | [])[] | SailGetMultipleTransactionsError;
}> => {
    const mutableKeys = Array.from(keys);
    const results = await Promise.all(
        chunks(mutableKeys, GET_MULTIPLE_TRANSACTIONS_CHUNK_SIZE).map(
            async (
                chunk
            ): Promise<{
                keys: typeof chunk;
                array: (SignatureResult | [])[];
                error?: SailGetMultipleTransactionsError;
            }> => {
                try {
                    const array = await connection.getSignatureStatuses(chunk, { searchTransactionHistory: true });
                    return { keys: chunk, array: new Array(chunk.length).fill([]) };
                } catch (e) {
                    if (e instanceof SailGetMultipleTransactionsError) {
                        const error = new SailGetMultipleTransactionsError(chunk, commitment, e);
                        onError(error);
                        return { keys: chunk, array: new Array(chunk.length).fill(null), error };
                    }
                    throw e;
                }
            }
        )
    );

    return {
        keys,
        array: results.flatMap((result) => result.array),
    };
};
