import * as nearAPI from 'near-api-js';
import { type PublicKey as NearPublicKey } from 'near-api-js/lib/utils';

import type { LocalKeypairStore } from '@mindblox-wallet-adapter/base';
import { ChainNetworks } from '@mindblox-wallet-adapter/base';

import { parseSeedPhrase } from './nearSeedPhrase';

export { baseDecode } from 'borsh';

const { keyStores } = nearAPI;

export class AbstractEntity<T> {
    constructor(protected partial: Partial<T>) {
        Object.assign(this, this.partial);
    }
}

export enum KeyType {
    ED25519 = 0,
    BASE58 = 1,
}

export abstract class Assignable {
    constructor(properties: any) {
        Object.keys(properties).map((key: any) => {
            (this as any)[key] = properties[key];
        });
    }
}

export class PublicKey extends AbstractEntity<NearPublicKey> {
    // export class PublicKey extends NearPublicKey {
    // this.partial.data
    // this.partial.keyType
    // this.partial.toString
    // this.partial.verify
    public toString = this.partial.toString;
    public keyType: KeyType = KeyType.ED25519;
    public data: Uint8Array | undefined = this.partial.data;

    public toBase58 = () => {
        // console.debug("this?")
        // console.dir(this);
        // console.debug(' this.partial')
        // console.dir(this.partial)
        const currentKey = this.partial as string;
        console.info(`fetched base58 key: ${currentKey}`);
        // console.debug('currentKey', currentKey)
        // this.keyType = KeyType.BASE58;
        // const currentKey = String(this);
        // const currentKey = this.partial.data;
        // const currentData = Buffer.from(currentKey);
        // console.debug('currentKey')
        // console.dir(currentData)
        // if (!currentData) return;
        // this.partial.
        // const pubKeyBase58 = encodeBase58(currentData);
        // console.debug('pubKeyBase58', pubKeyBase58);
        // const pubKeyBase58: string = currentKey
        // .toString()
        // .substring(8, currentKey.toString().length);
        // console.debug(pubKeyBase58, pubKeyBase58)
        // const key = encodeBase58(pubKeyBase58);
        // return pubKeyBase58;
        return currentKey;
    };
}

export const keyStore = new keyStores.BrowserLocalStorageKeyStore();

export const generateNearKeys = async (recoverySeedPhrase: string) => {
    const { publicKey, secretKey } = await parseSeedPhrase(recoverySeedPhrase);
    if (!publicKey || !secretKey) throw new Error('Invalid seed phrase');
    // Parse keys for their base58 string
    const pubKeyBase58: string = publicKey.toString().substring(8, publicKey.toString().length);
    const privKeyBase58: string = secretKey.toString().substring(8, secretKey.toString().length);
    return {
        chain: ChainNetworks.NEAR,
        privateKey: privKeyBase58,
        publicKey: pubKeyBase58,
    } as LocalKeypairStore;
};
