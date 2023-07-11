import { ChainNetworks } from '../chains';
import type { SolanaKeys } from '../networks/solana';
import {
    getKeyPairFromSeedPhrase as getSolanaKeypairFromSeedPhrase,
    getKeyPairFromPrivateKey as getSolanaKeypairFromPrivateKey,
    getNativeKeyPairFromPrivateKey as getSolanaNativeKeypairFromPrivateKey,
    getPublicKey as getSolanaPublicKey,
} from '../networks/solana';
import type { NearKeypair } from '../networks/near';
import {
    getKeyPairFromSeedPhrase as getNearKeypairFromSeedPhrase,
    getKeyPairFromPrivateKey as getNearKeypairFromPrivateKey,
    getNativeKeyPairFromPrivateKey as getNearNativeKeypairFromPrivateKey,
    getPublicKey as getNearPublicKey,
} from '../networks/near';
import type { LocalKeyPair } from '../store';

export type NativeKeypair<T> = T extends {
    chain: string;
}
    ? T['chain']
    : T;

export const getKeyPairFromSeedPhrase = async (chain: string, seedPhrase: string) => {
    console.debug(`Getting ${chain} keypair from seedPhrase: ${seedPhrase} `);
    switch (chain) {
        case ChainNetworks.SOL:
            return getSolanaKeypairFromSeedPhrase(seedPhrase);
        case ChainNetworks.NEAR:
            return await getNearKeypairFromSeedPhrase(seedPhrase);
        default:
            throw new Error(`Invalid chain network '${chain}'!`);
    }
};

export const getKeyPairFromPrivateKey = (chain: string, privateKey: string): LocalKeyPair | undefined => {
    console.debug(`Getting ${chain} keypair from privateKey: ${privateKey} `);
    switch (chain) {
        case ChainNetworks.SOL:
            return getSolanaKeypairFromPrivateKey(privateKey);
        case ChainNetworks.NEAR:
            return getNearKeypairFromPrivateKey(privateKey);
        default:
            throw new Error(`Invalid chain network '${chain}'!`);
    }
};

export const getNativeKeyPairFromPrivateKey = (
    chain: string,
    privateKey: string
): NativeKeypair<SolanaKeys | NearKeypair> | undefined => {
    console.debug(`Getting ${chain} keypair from privateKey: ${privateKey} `);
    switch (chain) {
        case ChainNetworks.SOL:
            return getSolanaNativeKeypairFromPrivateKey(privateKey);
        case ChainNetworks.NEAR:
            return getNearNativeKeypairFromPrivateKey(privateKey);
        default:
            throw new Error(`Invalid chain network '${chain}'!`);
    }
};

export const getPublicKey = (chain: string, publicKey: string) => {
    if (!chain || !publicKey) return;
    console.debug(`Getting ${chain} publicKey: ${publicKey} `);
    switch (chain) {
        case ChainNetworks.SOL:
            return getSolanaPublicKey(publicKey);
        case ChainNetworks.NEAR:
            return getNearPublicKey(publicKey);
        default:
            throw new Error(`Invalid chain network '${chain}'!`);
    }
};
