import { NearTransaction, SolanaTransaction } from '..';

import type { ChainConnection, ChainTicker, NearConnection, SolanaConnection } from '@mindblox-wallet-adapter/base';
import { ChainTickers } from '@mindblox-wallet-adapter/base';

abstract class TransactionFactory<T> {
    abstract createTransaction(connection: ChainConnection): T;
}

export class SolanaTransactionFactory extends TransactionFactory<SolanaTransaction> {
    createTransaction(connection: SolanaConnection) {
        return new SolanaTransaction();
    }
}

export class NearTransactionFactory extends TransactionFactory<NearTransaction> {
    createTransaction(connection: NearConnection) {
        return new NearTransaction();
    }
}

export class ChainTransactionFactory {
    static createTransaction<K>(chain: ChainTicker, connection: ChainConnection): K {
        if (chain === ChainTickers.SOL) {
            return new SolanaTransactionFactory().createTransaction(connection as SolanaConnection) as K;
        }

        if (chain === ChainTickers.NEAR) {
            return new NearTransactionFactory().createTransaction(connection as NearConnection) as K;
        }

        throw new Error('Unsupported chain');
    }
}
