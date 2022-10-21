import * as nearAPI from "near-api-js";
import { PublicKey as NearPublicKey } from "near-api-js/lib/utils";
import * as nearSeedPhrase from "near-seed-phrase";

import { ChainNetworks } from "../../../chains";
import { KeyPair as lKeypair } from "../../../../../store/types/webWalletTypes";
// import bs58 from 'bs58';
export {
  // baseEncode as base_encode,
  // baseDecode as base_decode,
  baseDecode,
  // serialize,
  // deserialize,
  // Schema,
  // BorshError,
  // BinaryWriter,
  // BinaryReader,
} from "borsh";
// import { Assignable } from './enums';

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

// key_type_to_str = (keyType: KeyType): string => {
//   switch (keyType) {
//   case KeyType.ED25519: return 'ed25519';
//   case KeyType.BASE58: return 'base58';
//   default: throw new Error(`Unknown key type ${keyType}`);
//   }
// }

// str_to_key_type = (keyType: string): KeyType => {
//   switch (keyType.toLowerCase()) {
//   case 'ed25519': return KeyType.ED25519;
//   case 'base58': return KeyType.BASE58;
//   default: throw new Error(`Unknown key type ${keyType}`);
//   }
// }

export abstract class Assignable {
  constructor(properties: any) {
    Object.keys(properties).map((key: any) => {
      (this as any)[key] = properties[key];
    });
  }
}

// export class PublicKeyOriginal extends Assignable {
//   public keyType: KeyType = KeyType.ED25519;
//   public data: Uint8Array | null = null;

//   static from(value: string | PublicKey): PublicKey {
//       if (typeof value === 'string') {
//           return this.fromString(value);
//       }
//       return value;
//   }

//   static fromString(encodedKey: string): PublicKey {
//       const parts = encodedKey.split(':');
//       if (parts.length === 1) {
//           return new PublicKey({ keyType: KeyType.ED25519, data: baseDecode(parts[0]) });
//       } else if (parts.length === 2) {
//           return new PublicKey({ keyType: str_to_key_type(parts[0]), data: base_decode(parts[1]) });
//       } else {
//           throw new Error('Invalid encoded key format, must be <curve>:<encoded key>');
//       }
//   }

//   toString(): string {
//       return `${key_type_to_str(this.keyType)}:${base_encode(this.data)}`;
//   }

//   verify(message: Uint8Array, signature: Uint8Array): boolean {
//       switch (this.keyType) {
//       case KeyType.ED25519: return nacl.sign.detached.verify(message, signature, this.data);
//       default: throw new Error(`Unknown key type ${this.keyType}`);
//       }
//   }
// }

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
    // console.error("this?")
    // console.dir(this);
    // console.error(' this.partial')
    // console.dir(this.partial)
    const currentKey = this.partial as string;
    console.info(`fetched base58 key: ${currentKey}`);
    // console.error('currentKey', currentKey)
    // this.keyType = KeyType.BASE58;
    // const currentKey = String(this);
    // const currentKey = this.partial.data;
    // const currentData = Buffer.from(currentKey);
    // console.error('currentKey')
    // console.dir(currentData)
    // if (!currentData) return;
    // this.partial.
    // const pubKeyBase58 = bs58.encode(currentData);
    // console.error('pubKeyBase58', pubKeyBase58);
    // const pubKeyBase58: string = currentKey
    // .toString()
    // .substring(8, currentKey.toString().length);
    // console.error(pubKeyBase58, pubKeyBase58)
    // const key = bs58.encode(pubKeyBase58);
    // return pubKeyBase58;
    return currentKey;
  };
}

export const keyStore = new keyStores.BrowserLocalStorageKeyStore();

export const generateNearKeys = (recoverySeedPhrase: string) => {
  const { publicKey, secretKey } =
    nearSeedPhrase.parseSeedPhrase(recoverySeedPhrase);
  // Parse keys for their base58 string
  const pubKeyBase58: string = publicKey
    .toString()
    .substring(8, publicKey.toString().length);
  const privKeyBase58: string = secretKey
    .toString()
    .substring(8, secretKey.toString().length);
  return {
    chain: ChainNetworks.NEAR,
    privateKey: privKeyBase58,
    publicKey: pubKeyBase58,
  } as lKeypair;
};

export const removeEd25519 = (text: string) => {
  return text.replace("ed25519:", "");
};
