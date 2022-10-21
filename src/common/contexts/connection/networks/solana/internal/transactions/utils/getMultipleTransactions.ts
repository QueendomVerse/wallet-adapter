import type {
  Connection,
  Finality,
  ParsedTransactionWithMeta,
} from "@solana/web3.js";

import { SailGetMultipleTransactionsError } from "../../../errors";
import { chunks } from "../../../utils";
import { asyncEnsureRpcConnection } from "../../../../../../../utils";

const GET_MULTIPLE_TRANSACTIONS_CHUNK_SIZE = 99;

export const getMultipleTransactions = async (
  connection: Connection,
  keys: readonly string[],
  onGetMultipleAccountsError: (err: SailGetMultipleTransactionsError) => void,
  commitment: Finality = "confirmed"
): Promise<{
  keys: readonly string[];
  array: readonly (
    | ParsedTransactionWithMeta
    | null
    | SailGetMultipleTransactionsError
  )[];
}> => {
  const result = await Promise.all(
    chunks(keys, GET_MULTIPLE_TRANSACTIONS_CHUNK_SIZE).map(
      async (
        chunk
      ): Promise<
        {
          keys: string[];
        } & (
          | {
              array: (ParsedTransactionWithMeta | null)[];
            }
          | {
              error: SailGetMultipleTransactionsError;
            }
        )
      > => {
        try {
          return {
            keys: chunk,
            array: await (
              await asyncEnsureRpcConnection(connection)
            ).getParsedTransactions(chunk, commitment),
          };
        } catch (e) {
          const error = new SailGetMultipleTransactionsError(
            chunk,
            commitment,
            e
          );
          onGetMultipleAccountsError(error);
          return {
            keys: chunk,
            error,
          };
        }
      }
    )
  );
  const array = result
    .map((el) => {
      if ("error" in el) {
        return el.keys.map(() => el.error);
      }
      return el.array;
    })
    .flat();
  return { keys, array };
};
