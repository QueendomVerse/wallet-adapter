import type { Chain } from '../chains';

export interface EncryptedData {
    initVector: string;
    content: string;
}

export interface HashedSecret {
    salt: string;
    content: string;
}

export interface DecryptedWallet {
    name: string;
    chain: Chain;
    privateKey: string;
    publicKey: string;
    seed: Uint8Array;
    seedPhrase: string;
}
