import {
  Wallet,
  // WalletContext,
  // useWallet,
  // WalletProvider as BaseWalletProvider,
  // WalletContextState
} from "@solana/wallet-adapter-react";

import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  SolletWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import type { WalletAdapter } from "./adapter";
import type { MessageSignerWalletAdapter, SignerWalletAdapter } from "./signer";
import { WebWalletAdapter } from "../WebWalletAdapter";
import { BrowserWalletAdapter } from "../../near";

export interface CustomWallet extends Wallet {
  adapter: Adapter;
}

export interface CustomWalletAdapter extends WalletAdapter {
  autoConnect: boolean;
  adapter: CustomWalletAdapter;
  // connect(privateKey?: string): Promise<void>;
  connect(
    chain?: string,
    label?: string,
    // privateKey?: string
    privateKey?: Uint8Array
  ): Promise<void>;
  connecting: boolean;
  select(chain?: string, label?: string, privateKey?: string): Promise<void>;
  wallet: CustomWallet;
  wallets: CustomWallet[];
}

export type Adapter =
  | WalletAdapter
  | CustomWalletAdapter
  // | WalletAdapter
  | SignerWalletAdapter
  | MessageSignerWalletAdapter
  | PhantomWalletAdapter
  | LedgerWalletAdapter
  | SolflareWalletAdapter
  | SolletWalletAdapter
  | WebWalletAdapter
  | BrowserWalletAdapter;

export enum WalletAdapterNetwork {
  Mainnet = "mainnet-beta",
  Testnet = "testnet",
  Devnet = "devnet",
}
