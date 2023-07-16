import type { ChainTicker } from '@mindblox-wallet-adapter/base';
import { ChainTickers } from '@mindblox-wallet-adapter/base';
import { NearKeypair, SolanaKeypair } from '..';

abstract class KeypairFactory<T> {
    abstract createKeypair(secretKey?: Uint8Array): T;
}

export class SolanaKeypairFactory extends KeypairFactory<SolanaKeypair> {
    createKeypair(secretKey?: Uint8Array): SolanaKeypair {
        return new SolanaKeypair(secretKey);
    }
}

export class NearKeypairFactory extends KeypairFactory<NearKeypair> {
    createKeypair(secretKey?: Uint8Array): NearKeypair {
        return new NearKeypair(secretKey);
    }
}

export class ChainKeypairFactory {
    static createKeypair<K>(chain: ChainTicker, secretKey?: Uint8Array): K {
        if (chain === ChainTickers.SOL) {
            return new SolanaKeypairFactory().createKeypair(secretKey) as K;
        }

        if (chain === ChainTickers.NEAR) {
            return new NearKeypairFactory().createKeypair(secretKey) as K;
        }

        throw new Error('Unsupported chain');
    }
}
