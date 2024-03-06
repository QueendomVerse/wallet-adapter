import { NearConnectionConfig, CommonAdapterNetwork, SolanaWalletAdapterNetwork, NearWalletAdapterNetwork, ChainAdapterNetwork } from '..';
import { NearConnection, SolanaConnection, getAdapterNetwork } from '..';

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
import type { ChainConnectionConfig, ChainTicker, SolanaConnectionConfig } from '@mindblox-wallet-adapter/base';
import { ChainTickers } from '@mindblox-wallet-adapter/base';

abstract class ConnectionFactory<T> {
    abstract createConnection(): T;
}

export class SolanaConnectionFactory extends ConnectionFactory<SolanaConnection> {
    private _endpointMap: SolanaEndpointMap;
    private _config?: SolanaConnectionConfig;

    constructor(name?: SOLANA_ENDPOINT_NAME | null, config?: SolanaConnectionConfig) {
        super();
        this._config = config;
        this._endpointMap = getSolanaEndpointMap(name ?? SolanaWalletAdapterNetwork.Devnet);

        console.debug(`Solana connection endpoint map: ${JSON.stringify(this._endpointMap )}`)
        console.debug(`Solana connection config: ${JSON.stringify(config)}`)
    }
    createConnection() {
        console.debug(`Solana connection endpoint: ${this._endpointMap.endpoint}`)
        return new SolanaConnection(this._endpointMap.endpoint, this._config);
    }
}

export class NearConnectionFactory extends ConnectionFactory<NearConnection> {
    private _endpointMap: NearEndpointMap;
    private _config?: NearConnectionConfig;

    constructor(name?: NEAR_ENDPOINT_NAME | null, config?: NearConnectionConfig) {
        super();
        this._config = config;
        this._endpointMap = getNearEndpointMap(name ?? NearWalletAdapterNetwork.Testnet);
        console.debug(`Near connection endpoint map: ${JSON.stringify(this._endpointMap )}`)
        console.debug(`Near connection config: ${JSON.stringify(config)}`)
    }

    createConnection() {
        const config: NearConnectionConfig = !!this._config
            ? this._config
            : {
                nodeUrl: this._endpointMap.nodeUrl,
                networkId: this._endpointMap.networkId,
                jsvmAccountId: this._endpointMap.jsvmAccountId,
            };
        console.debug(`Near create connection config: ${JSON.stringify(config)}`)
        return new NearConnection(config);
    }
}

export class ChainConnectionFactory {
    static createConnection<K>(chain: ChainTicker, network: ChainAdapterNetwork, config?: ChainConnectionConfig): K {
        console.debug(`Chain: ${chain}, Network: ${network}`)
        if (chain === ChainTickers.SOL) {
            return new SolanaConnectionFactory(
                getAdapterNetwork(chain, network) as SOLANA_ENDPOINT_NAME, config as unknown as SolanaConnectionConfig
            ).createConnection() as unknown as K;
        }

        if (chain === ChainTickers.NEAR) {
            return new NearConnectionFactory(
                getAdapterNetwork(chain, network) as NEAR_ENDPOINT_NAME, config as unknown as NearConnectionConfig
            ).createConnection() as unknown as K;
        }

        throw new Error('Unsupported chain');
    }
}