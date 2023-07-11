import { encode as encodeBs58, decode as decodeBs58 } from 'bs58';
import { mnemonicToSeedSync } from 'bip39';

import { ChainNetworks } from '../../chains';
import { useAccount, ConnectionError, getAdapterNetwork } from '.';
import {
    // Connection,
    Keypair,
    PublicKey,
    // LAMPORTS_PER_SOL
} from '@solana/web3.js';
import * as dotenv from 'dotenv';

import type { LocalKeyPair } from '../../store/types';
import type { SolanaKeys } from './types/keypair';
import type { WalletAdapterNetwork } from '@mindblox-wallet-adapter/base';

dotenv.config();

// async due to how other networks handle connections.
const nodeRpcUrl: string = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST ?? '';
const nodeWsUri: string | undefined = process.env.NEXT_PUBLIC_SOLANA_WS_HOST ?? '';
const nodeNetwork: WalletAdapterNetwork = getAdapterNetwork(process.env.NEXT_PUBLIC_SOLANA_NETWORK);
export const getAccount = async (privateKey: string) => {
    try {
        return useAccount(privateKey, nodeRpcUrl, nodeWsUri, nodeNetwork);
    } catch (err) {
        throw new ConnectionError(`Failed getting wallet: ${err}`);
    }
};

export const getKeyPairFromSeedPhrase = (seedPhrase: string) => {
    const seedBuffer = Buffer.from(mnemonicToSeedSync(seedPhrase));
    const seed = Uint8Array.prototype.subarray.call(seedBuffer, 0, 32);

    const keyPair = Keypair.fromSeed(seed);
    const encodedKeypair = encodeBs58(Buffer.from(keyPair.secretKey));
    const encodedPublicKey = keyPair.publicKey.toBase58();

    return {
        chain: ChainNetworks.SOL,
        privateKey: encodedKeypair,
        publicKey: encodedPublicKey,
    } as LocalKeyPair;
};

export const getNativeKeyPairFromPrivateKey = (privateKey: string): SolanaKeys => {
    return {
        keypair: Keypair.fromSecretKey(decodeBs58(privateKey)),
    };
};

export const getKeyPairFromPrivateKey = (privateKey: string): LocalKeyPair => {
    const { keypair } = getNativeKeyPairFromPrivateKey(privateKey);

    const encodedKeypair = encodeBs58(Buffer.from(keypair.secretKey));
    const encodedPublicKey = keypair.publicKey.toBase58();
    return {
        chain: ChainNetworks.SOL,
        privateKey: encodedKeypair,
        publicKey: encodedPublicKey,
    } as LocalKeyPair;
};

export const getPublicKey = (publicKey: string) => {
    const pubKey = new PublicKey(publicKey);

    return {
        chain: ChainNetworks.SOL,
        publicKey: pubKey.toBase58(),
    } as LocalKeyPair;
};

//@TODO: configure network;
export const getBalance = async (privateKey: string) => {
    // console.warn('func: getBalance');
    if (!privateKey) {
        throw new Error('Get get balance without providing a private key!');
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

export const sendFundsTransaction = async (privateKey: string, toAddress: string, amount: string) => {
    const { send } = await getAccount(privateKey);
    return send(toAddress, amount);
};
