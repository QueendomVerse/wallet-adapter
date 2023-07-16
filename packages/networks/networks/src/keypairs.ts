import type { Chain, LocalKeypairStore } from '@mindblox-wallet-adapter/base';
import { ChainNetworks } from '@mindblox-wallet-adapter/base';

import type { SolanaKeys } from '@mindblox-wallet-adapter/solana';
import {
    getKeyPairFromSeedPhrase as getSolanaKeypairFromSeedPhrase,
    getKeyPairFromPrivateKey as getSolanaKeypairFromPrivateKey,
    getNativeKeyPairFromPrivateKey as getSolanaNativeKeypairFromPrivateKey,
    getPublicKey as getSolanaPublicKey,
} from '@mindblox-wallet-adapter/solana';
import type { NearKeypair } from '@mindblox-wallet-adapter/near';
import {
    getKeyPairFromSeedPhrase as getNearKeypairFromSeedPhrase,
    getKeyPairFromPrivateKey as getNearKeypairFromPrivateKey,
    getNativeKeyPairFromPrivateKey as getNearNativeKeypairFromPrivateKey,
    getPublicKey as getNearPublicKey,
} from '@mindblox-wallet-adapter/near';

export type NativeKeypair<T> = T extends {
    chain: Chain;
}
    ? T['chain']
    : T;

export const getKeyPairFromSeedPhrase = async (chain: Chain, seedPhrase: string) => {
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

export const getKeyPairFromPrivateKey = (chain: Chain, privateKey: string): LocalKeypairStore | undefined => {
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
    chain: Chain,
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

export const getPublicKey = (chain: Chain, publicKey: string) => {
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
