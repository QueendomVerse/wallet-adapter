import * as bs58 from "bs58";
import {
  AccountInfo,
  Connection,
  clusterApiUrl,
  Keypair,
  SystemProgram,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  // TransactionConfirmationStatus,
  // FeeCalculator
} from "@solana/web3.js";
import cf from "cross-fetch";
import fetch from "fetch-retry";

import { asyncEnsureRpcConnection } from "../../../../../utils";
import { WalletAdapterNetwork } from "../../../../../contexts/connection/networks/core";
import { ConnectionError } from "../../../../../contexts/connection/networks/solana";

// Attempt at preventing infinite recursions
// https://github.com/solana-labs/solana/issues/24366
const crossRetry = fetch(cf);

export interface SolanaAccount {
  connection: () => Connection;
  keypair: () => Keypair;
  publicKey: () => PublicKey;
  getPublicKey: (pubKey: string) => PublicKey;
  account: () => Promise<AccountInfo<Buffer> | null>;
  balance: () => Promise<number>;
  airdrop: () => Promise<any>;
  send: (toAddress: string, amount: string) => Promise<any>;
}

export const useAccount = (
  privateKey: string,
  nodeRpcUrl?: string,
  nodeWsUrl?: string,
  network?: WalletAdapterNetwork
): SolanaAccount => {
  if (!nodeRpcUrl && !network) {
    throw new ConnectionError(
      "Cannot establish connection with solana without specifying either a node url or network!"
    );
  }
  console.info(
    `Connecting to solana via RPC: ${nodeRpcUrl ?? network}, WS: ${nodeWsUrl}`
  );

  const connection = (): Connection => {
    return nodeRpcUrl
      ? new Connection(nodeRpcUrl, {
          commitment: "confirmed",
          disableRetryOnRateLimit: true,
          fetch: crossRetry,
          wsEndpoint: nodeWsUrl,
        })
      : new Connection(clusterApiUrl(network), {
          commitment: "confirmed",
          disableRetryOnRateLimit: true,
          fetch: crossRetry,
          wsEndpoint: nodeWsUrl,
        });
  };

  const keypair = () => {
    return Keypair.fromSecretKey(bs58.decode(privateKey));
  };

  const publicKey = () => {
    return keypair().publicKey;
  };

  const getPublicKey = (pubKey: string) => {
    return new PublicKey(pubKey);
  };

  const account = async () => {
    // @TODO samething happening here as with balance below?
    return (
      // await asyncEnsureRpcConnection(conn)
      connection().getAccountInfo(keypair().publicKey)
    );
  };

  const balance = async () => {
    //@TODO why is a connection not establishing? or check not required?
    const lamports = await // await asyncEnsureRpcConnection(conn)
    connection().getBalance(keypair().publicKey);
    return lamports / LAMPORTS_PER_SOL;
  };

  const airdrop = async () => {
    if (
      ![WalletAdapterNetwork.Devnet, WalletAdapterNetwork.Testnet].includes(
        network!
      )
    ) {
      return console.warn(`Not possible to airdrop on ${network}`);
    }
    return (
      // await asyncEnsureRpcConnection(connection())
      connection().requestAirdrop(keypair().publicKey, LAMPORTS_PER_SOL)
    );
  };

  // const confirm = async (transactionId: string) => {
  //   const conn = connection();
  //   // const latestBlockhash = (await asyncEnsureRpcConnection(conn)).getLatestBlockhash();
  //   const transaction = (await asyncEnsureRpcConnection(conn)).getParsedTransaction (transactionId);
  //   if (!transaction) return;

  //   const signature = transaction.transaction.signatures[0];
  //   if (!signature) return;

  //   const result = await (await asyncEnsureRpcConnection(conn)).confirmTransaction(signature);
  //   if (!result) return;

  //   return true;

  //   const tx = (await asyncEnsureRpcConnection(conn)).getParsedTransaction (transactionId);
  //   if (!tx) return false;
  // };

  const send = async (toAddress: string, amount: string) => {
    if (!amount || isNaN(parseFloat(amount))) return;

    const conn = connection();
    const transaction = new Transaction();
    try {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair().publicKey,
          toPubkey: getPublicKey(toAddress),
          lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
        })
      );
      const signature = await sendAndConfirmTransaction(conn, transaction, [
        keypair(),
      ]);
      const result = await (
        await asyncEnsureRpcConnection(conn)
      )
        // conn
        .getParsedTransaction(signature);
      return {
        txid: signature,
        gas: result?.meta?.fee! / LAMPORTS_PER_SOL,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.info(err.message);
        throw new Error(err.message);
      } else {
        console.info("Unexpected error", err);
      }
    }
  };

  return {
    connection,
    keypair,
    publicKey,
    getPublicKey,
    account,
    balance,
    airdrop,
    send,
  };
};
