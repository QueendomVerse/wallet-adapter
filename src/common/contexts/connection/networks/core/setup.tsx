import { useMemo } from "react";
// import { clusterApiUrl } from '@solana/web3.js';
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  SolletWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import getConfig from "next/config";

import { WalletAdapterNetwork } from "./base";
import { WebWalletAdapter } from "./WebWalletAdapter";
import { BrowserWalletAdapter as NearBrowserWalletAdapter } from "../near/BrowserWalletAdapter";

const { publicRuntimeConfig } = getConfig();

export const getAdapterNetwork = (network: string): WalletAdapterNetwork => {
  switch (network) {
    case "devnet":
      return WalletAdapterNetwork.Devnet;
    case "testnet":
      return WalletAdapterNetwork.Testnet;
    case "mainnet-beta":
      return WalletAdapterNetwork.Mainnet;
    default:
      return WalletAdapterNetwork.Devnet;
  }
};

const getNetwork = (net: string) => {
  return net != "localnet" ? getAdapterNetwork(net) : net;
};

export const initializeWallets = () => {
  const network = getAdapterNetwork(publicRuntimeConfig.publicSolanaNetwork);
  console.info(
    `walletProvider.rpc network: ${getNetwork(
      publicRuntimeConfig.publicSolanaNetwork
    )}`
  );
  const node_uri = publicRuntimeConfig.publicSolanaRpcHost;
  console.info(`walletProvider.rpc node: ${node_uri}`);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new WebWalletAdapter(node_uri ? { node: node_uri } : { network }),
      new SolflareWalletAdapter({ network }),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter({ network }),
      new NearBrowserWalletAdapter(),
    ],
    [network]
  );
  // console.debug("Setup Wallets:")
  // console.dir(wallets);
  return wallets;
};
