import { ChainTickers } from "../../contexts/connection/chains";

import {
  getBalance as getSolanaBalance,
  sendTransaction as sendSolanaTransaction,
} from "../../contexts/wallets/solana";
import {
  getBalance as getNearBalance,
  sendTransaction as sendNearTransaction,
} from "../../contexts/wallets/near";
import {
  KeyPair as lKeypair,
  // Wallet as lWallet,
} from "../../store/types/webWalletTypes";
import { Wallet as lWallet } from "../../store/types/webWalletTypes";
import { Wallet as DbWallet } from "../../localDB/db";

export const getBalance = async (ticker: string, keypair: lKeypair) => {
  // console.debug(`Getting balance (${ticker}): ${keypair.publicKey}`);
  if (!keypair.privateKey) return;

  switch (ticker) {
    case ChainTickers.SOL:
      return await getSolanaBalance(keypair.privateKey);
    case ChainTickers.NEAR:
      return await getNearBalance(keypair.privateKey);
    default:
      throw new Error(`Invalid chain ticker '${ticker}'!`);
  }
};

export const sendTransaction = async (
  ticker: string,
  keypair: lKeypair,
  toAddress: string,
  amount: string
) => {
  //@TODO: redundent, consolidate?
  switch (ticker) {
    case ChainTickers.SOL:
      return await sendSolanaTransaction(
        keypair.privateKey!,
        toAddress,
        amount
      );
    case ChainTickers.NEAR:
      return await sendNearTransaction(keypair.privateKey!, toAddress, amount);
    default:
      throw new Error(`Invalid chain ticker '${ticker}'!`);
  }
};

export const getValidWallets = (wallets: (lWallet | undefined)[]) => {
  return wallets.filter((w): w is lWallet => !!w);
};

export const getValidDbWallets = (wallets: (DbWallet | undefined)[]) => {
  return wallets.filter((w): w is DbWallet => !!w);
};

export const getPrimaryWallet = (wallets: lWallet[]) => {
  return wallets.find((w) => w.label === "primary");
};
