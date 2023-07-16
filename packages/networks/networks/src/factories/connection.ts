import type { NearConnectionConfig, ChainAdapterNetworks } from '..';
import { NearConnection, SolanaConnection, ChainAdapterNetwork, getAdapterNetwork } from '..';

import type {
    ENDPOINT_NAME as SOLANA_ENDPOINT_NAME,
    EndpointMap as SolanaEndpointMap,
} from '@mindblox-wallet-adapter/solana';
import { getEndpointMap as getSolanaEndpointMap } from '@mindblox-wallet-adapter/solana';
import type {
    ENDPOINT_NAME as NEAR_ENDPOINT_NAME,
    EndpointMap as NearEndpointMap,
} from '@mindblox-wallet-adapter/near';
import { getEndpointMap as getNearEndpointMap } from '@mindblox-wallet-adapter/near';
import type { ChainTicker } from '@mindblox-wallet-adapter/base';
import { ChainTickers } from '@mindblox-wallet-adapter/base';

abstract class ConnectionFactory<T> {
    abstract createConnection(): T;
}

export class SolanaConnectionFactory extends ConnectionFactory<SolanaConnection> {
    private _endpoint: SolanaEndpointMap;
    constructor(name?: SOLANA_ENDPOINT_NAME | null) {
        super();
        this._endpoint = getSolanaEndpointMap(name ?? 'devnet');
    }
    createConnection() {
        return new SolanaConnection(this._endpoint.name);
    }
}

export class NearConnectionFactory extends ConnectionFactory<NearConnection> {
    private _endpoint: NearEndpointMap;
    constructor(name?: NEAR_ENDPOINT_NAME | null) {
        super();
        this._endpoint = getNearEndpointMap(name ?? 'testnet');
    }

    createConnection() {
        const config: NearConnectionConfig = {
            nodeUrl: this._endpoint.nodeUrl,
            networkId: this._endpoint.networkId,
            jsvmAccountId: this._endpoint.jsvmAccountId,
        };
        return new NearConnection(config);
    }
}

export class ChainConnectionFactory {
    static createConnection<K>(chain: ChainTicker, network: ChainAdapterNetworks): K {
        if (chain === ChainTickers.SOL) {
            return new SolanaConnectionFactory(network as SOLANA_ENDPOINT_NAME).createConnection() as K;
        }

        if (chain === ChainTickers.NEAR) {
            return new NearConnectionFactory(network as NEAR_ENDPOINT_NAME).createConnection() as K;
        }

        throw new Error('Unsupported chain');
    }
}
