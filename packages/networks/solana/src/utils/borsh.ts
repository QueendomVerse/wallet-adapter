import { BinaryReader, BinaryWriter } from 'borsh';
import { encode as encodeBase58, decode as decodeBase58 } from 'bs58';

import type { StringPublicKey } from '@mindblox-wallet-adapter/base';
import { SolanaPublicKey } from '@mindblox-wallet-adapter/base';

export const extendBorsh = (): void => {
    (
        BinaryReader.prototype as BinaryReader & {
            readPubkey: () => SolanaPublicKey;
            readPubkeyAsString: () => StringPublicKey;
        }
    ).readPubkey = function () {
        return new SolanaPublicKey(this.readFixedArray(32));
    };

    (
        BinaryWriter.prototype as BinaryWriter & {
            writePubkey: (value: SolanaPublicKey) => void;
            writePubkeyAsString: (value: StringPublicKey) => void;
        }
    ).writePubkey = function (value) {
        this.writeFixedArray(value.toBuffer());
    };

    (
        BinaryReader.prototype as BinaryReader & {
            readPubkey: () => SolanaPublicKey;
            readPubkeyAsString: () => StringPublicKey;
        }
    ).readPubkeyAsString = function () {
        return encodeBase58(this.readFixedArray(32)) as StringPublicKey;
    };

    (
        BinaryWriter.prototype as BinaryWriter & {
            writePubkey: (value: SolanaPublicKey) => void;
            writePubkeyAsString: (value: StringPublicKey) => void;
        }
    ).writePubkeyAsString = function (value) {
        this.writeFixedArray(decodeBase58(value));
    };
};

extendBorsh();
