import { PublicKey } from '@solana/web3.js';
import { BinaryReader, BinaryWriter } from 'borsh';
import { encode as encodeBs58, decode as decodeBs58 } from 'bs58';

import type { StringPublicKey } from '../../../networks';

export const extendBorsh = (): void => {
    (
        BinaryReader.prototype as BinaryReader & {
            readPubkey: () => PublicKey;
            readPubkeyAsString: () => StringPublicKey;
        }
    ).readPubkey = function () {
        return new PublicKey(this.readFixedArray(32));
    };

    (
        BinaryWriter.prototype as BinaryWriter & {
            writePubkey: (value: PublicKey) => void;
            writePubkeyAsString: (value: StringPublicKey) => void;
        }
    ).writePubkey = function (value) {
        this.writeFixedArray(value.toBuffer());
    };

    (
        BinaryReader.prototype as BinaryReader & {
            readPubkey: () => PublicKey;
            readPubkeyAsString: () => StringPublicKey;
        }
    ).readPubkeyAsString = function () {
        return encodeBs58(this.readFixedArray(32)) as StringPublicKey;
    };

    (
        BinaryWriter.prototype as BinaryWriter & {
            writePubkey: (value: PublicKey) => void;
            writePubkeyAsString: (value: StringPublicKey) => void;
        }
    ).writePubkeyAsString = function (value) {
        this.writeFixedArray(decodeBs58(value));
    };
};

extendBorsh();
