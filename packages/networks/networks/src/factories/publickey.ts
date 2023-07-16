import type { ChainTicker } from '@mindblox-wallet-adapter/base';
import { ChainTickers } from '@mindblox-wallet-adapter/base';
import { NearPublicKey, SolanaPublicKey } from '..';

abstract class PublicKeyFactory<T> {
    abstract createPublicKey(publicKey: string): T;
}

export class SolanaPublicKeyFactory extends PublicKeyFactory<SolanaPublicKey> {
    createPublicKey(publicKey: string) {
        return new SolanaPublicKey(publicKey);
    }
}

export class NearPublicKeyFactory extends PublicKeyFactory<NearPublicKey> {
    createPublicKey(publicKey: string) {
        return new NearPublicKey(publicKey);
    }
}

export class ChainPublicKeyFactory {
    static createPublicKey<K>(chain: ChainTicker, publicKey: string): K {
        if (chain === ChainTickers.SOL) {
            return new SolanaPublicKeyFactory().createPublicKey(publicKey) as K;
        }

        if (chain === ChainTickers.NEAR) {
            return new NearPublicKeyFactory().createPublicKey(publicKey) as K;
        }

        throw new Error('Unsupported chain');
    }
}
