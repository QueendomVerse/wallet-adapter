import { Connection, Transaction, TransactionSignature } from "@solana/web3.js";

import {
  BaseWalletAdapter,
  SendTransactionOptions,
  // WalletAdapter,
  WalletAdapter,
  WalletName,
} from "./adapter";
import {
  WalletSendTransactionError,
  WalletSignTransactionError,
} from "./errors";
import { asyncEnsureRpcConnection } from "../../../../../utils";

export interface SignerWalletAdapterProps {
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transaction: Transaction[]): Promise<Transaction[]>;
}

// export type SignerWalletAdapter = WalletAdapter & SignerWalletAdapterProps;
export type SignerWalletAdapter = WalletAdapter & SignerWalletAdapterProps;

export abstract class BaseSignerWalletAdapter
  extends BaseWalletAdapter
  implements SignerWalletAdapter
{
  async sendTransaction(
    transaction: Transaction,
    connection: Connection,
    options: SendTransactionOptions = {}
  ): Promise<TransactionSignature> {
    let emit = true;
    try {
      try {
        transaction = await this.prepareTransaction(transaction, connection);

        const { signers, ...sendOptions } = options;
        signers?.length && transaction.partialSign(...signers);

        transaction = await this.signTransaction(transaction);

        const rawTransaction = transaction.serialize();

        // return await (await asyncEnsureRpcConnection(connection)).sendRawTransaction(rawTransaction, sendOptions);
        return "dummy";
      } catch (error: any) {
        // If the error was thrown by `signTransaction`, rethrow it and don't emit a duplicate event
        if (error instanceof WalletSignTransactionError) {
          emit = false;
          throw error;
        }
        throw new WalletSendTransactionError(error?.message, error);
      }
    } catch (error: any) {
      if (emit) {
        this.emit("error", error);
      }
      throw error;
    }
  }

  abstract signTransaction(transaction: Transaction): Promise<Transaction>;
  abstract signAllTransactions(
    transaction: Transaction[]
  ): Promise<Transaction[]>;
}

export interface MessageSignerWalletAdapterProps {
  signMessage(message: Uint8Array): Promise<Uint8Array>;
}

// export type MessageSignerWalletAdapter = WalletAdapter & MessageSignerWalletAdapterProps;
export type MessageSignerWalletAdapter = WalletAdapter &
  MessageSignerWalletAdapterProps;

export abstract class BaseMessageSignerWalletAdapter
  extends BaseSignerWalletAdapter
  implements MessageSignerWalletAdapter
{
  abstract select(walletName: WalletName): // chain?: string,
  // label?: string,
  // privateKey?: Uint8Array
  Promise<void>;
  abstract connect(
    chain?: string,
    label?: string,
    privateKey?: Uint8Array
  ): Promise<void>;
  abstract signMessage(message: Uint8Array): Promise<Uint8Array>;
}
