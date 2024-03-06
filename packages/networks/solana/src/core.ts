import { encode as encodeBase58, decode as decodeBase58 } from 'bs58';
import { mnemonicToSeedSync } from 'bip39';

import { useAccount, ConnectionError, WalletAdapterNetwork, getAdapterCluster, getAdapterNetwork } from '.';

import type { SolanaKeys } from './types/keypair';
import type { LocalKeypairStore } from '@mindblox-wallet-adapter/base';
import { ChainNetworks, SolanaKeypair, SolanaPublicKey } from '@mindblox-wallet-adapter/base';

export interface AccountParams {
    privateKey: string,
    network?: string,
    nodeRpcUrl?: string,
    nodeWsUri?: string
}

export const getNetwork = (net?: string): WalletAdapterNetwork => {
    const _network = net != WalletAdapterNetwork.Localnet ? getAdapterCluster(net) : net;
    return _network as WalletAdapterNetwork;
};

export const getAccount = async ({
    privateKey,
    network,
    nodeRpcUrl,
    nodeWsUri
}: AccountParams) => {
    try {
        const nodeNetwork: WalletAdapterNetwork = getAdapterNetwork(network);
        return useAccount(privateKey, nodeNetwork, nodeRpcUrl, nodeWsUri);
    } catch (err) {
        throw new ConnectionError(`Failed getting wallet: ${err}`);
    }
};

export const getKeyPairFromSeedPhrase = (seedPhrase: string) => {
    const seedBuffer = Buffer.from(mnemonicToSeedSync(seedPhrase));
    const seed = Uint8Array.prototype.subarray.call(seedBuffer, 0, 32);

    const keyPair = SolanaKeypair.fromSeed(seed);
    const encodedPrivateKey = encodeBase58(Buffer.from(keyPair.secretKey));
    const encodedPublicKey = keyPair.publicKey.toBase58();

    return {
        chain: ChainNetworks.SOL,
        privateKey: encodedPrivateKey,
        publicKey: encodedPublicKey,
    } as LocalKeypairStore;
};

export const getNativeKeyPairFromPrivateKey = (privateKey: string): SolanaKeys => {
    return {
        keypair: SolanaKeypair.fromSecretKey(decodeBase58(privateKey)),
    };
};

export const getKeyPairFromPrivateKey = (privateKey: string): LocalKeypairStore => {
    const { keypair } = getNativeKeyPairFromPrivateKey(privateKey);

    const encodedPrivateKey = encodeBase58(Buffer.from(keypair.secretKey));
    const encodedPublicKey = keypair.publicKey.toBase58();

    return {
        chain: ChainNetworks.SOL,
        publicKey: encodedPublicKey,
        privateKey: encodedPrivateKey,
        keypair,
    } as LocalKeypairStore;
};

export const getPublicKey = (publicKey: string) => {
    const pubKey = new SolanaPublicKey(publicKey);

    return {
        chain: ChainNetworks.SOL,
        publicKey: pubKey.toBase58(),
    } as LocalKeypairStore;
};

//@TODO: configure network;
export const getBalance = async ({
        privateKey,
        network,
        nodeRpcUrl,
        nodeWsUri
}: AccountParams) => {
    // console.warn('func: getBalance');
    if (!privateKey) {
        throw new Error('Get get balance without providing a private key!');
    }
    const { balance, publicKey } = await getAccount({privateKey, network, nodeRpcUrl, nodeWsUri});
    try {
        const amount = await balance();
        console.info(`Solana (${publicKey()}) balance: ${amount}`);
        return amount;
    } catch (err) {
        console.error(`Failed getting balance: ${err}`);
    }
};

export const sendFundsTransaction = async ({
    privateKey,
    network,
    nodeRpcUrl,
    nodeWsUri
}: AccountParams, toAddress: string, amount: string) => {
    const { send } = await getAccount({privateKey, network, nodeRpcUrl, nodeWsUri});
    return send(toAddress, amount);
};
