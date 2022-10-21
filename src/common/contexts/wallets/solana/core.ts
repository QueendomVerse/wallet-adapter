import * as bs58 from "bs58";
import * as bip39 from "bip39";

import { ChainNetworks } from "../../../contexts/connection/chains";
import {
  useAccount,
  ConnectionError,
} from "../../../contexts/connection/networks/solana";
import {
  // Connection,
  Keypair,
  PublicKey,
  // LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { KeyPair as lKeypair } from "../../../store/types/webWalletTypes";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

export interface SolanaKeypair {
  keypair: Keypair;
}

// async due to how other networks handle connections.
const nodeRpcUrl: string = publicRuntimeConfig.publicSolanaRpcHost;
const nodeWsUri: string | undefined =
  publicRuntimeConfig.publicSolanaRpcHost ?? undefined;
export const getAccount = async (privateKey: string) => {
  try {
    return useAccount(
      privateKey,
      nodeRpcUrl,
      nodeWsUri,
      publicRuntimeConfig.publicSolanaNetwork
    );
  } catch (err) {
    throw new ConnectionError(`Failed getting wallet: ${err}`);
  }
};

export const getKeyPairFromSeedPhrase = (seedPhrase: string) => {
  const seed = bip39.mnemonicToSeedSync(seedPhrase).slice(0, 32);

  const keyPair = Keypair.fromSeed(seed);
  const encodedKeypair = bs58.encode(Buffer.from(keyPair.secretKey));
  const encodedPublicKey = keyPair.publicKey.toBase58();

  return {
    chain: ChainNetworks.SOL,
    privateKey: encodedKeypair,
    publicKey: encodedPublicKey,
  } as lKeypair;
};

export const getNativeKeyPairFromPrivateKey = (
  privateKey: string
): SolanaKeypair => {
  return {
    keypair: Keypair.fromSecretKey(bs58.decode(privateKey)),
  };
};

export const getKeyPairFromPrivateKey = (privateKey: string): lKeypair => {
  const { keypair } = getNativeKeyPairFromPrivateKey(privateKey);

  const encodedKeypair = bs58.encode(Buffer.from(keypair.secretKey));
  const encodedPublicKey = keypair.publicKey.toBase58();
  return {
    chain: ChainNetworks.SOL,
    privateKey: encodedKeypair,
    publicKey: encodedPublicKey,
  } as lKeypair;
};

export const getPublicKey = (publicKey: string) => {
  const pubKey = new PublicKey(publicKey);

  return {
    chain: ChainNetworks.SOL,
    publicKey: pubKey.toBase58(),
  } as lKeypair;
};

//@TODO: configure network;
export const getBalance = async (privateKey: string) => {
  // console.warn('func: getBalance');
  if (!privateKey) {
    throw new Error("Get get balance without providing a private key!");
  }
  const { balance, publicKey } = await getAccount(privateKey);
  try {
    const amount = await balance();
    console.info(`Solana (${publicKey()}) balance: ${amount}`);
    return amount;
  } catch (err) {
    console.error(`Failed getting balance: ${err}`);
  }
};

export const sendTransaction = async (
  privateKey: string,
  toAddress: string,
  amount: string
) => {
  const { send } = await getAccount(privateKey);
  return send(toAddress, amount);
};
