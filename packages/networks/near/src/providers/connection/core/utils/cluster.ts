export type ENDPOINT_NAME = 'mainnet' | 'testnet' | 'betanet';

export enum WalletAdapterNetwork {
    Mainnet = 'mainnet',
    Betanet = 'betanet',
    Testnet = 'testnet',
    Localnet = 'localnet',
}

const endpoint = {
    http: {
        testnet: 'http://rpc.testnet.near.org',
        betanet: 'http://rpc.betanet.near.org',
        mainnet: 'http://rpc.mainnet.near.org',
    },
    https: {
        testnet: 'https://rpc.testnet.near.org',
        betanet: 'https://rpc.betanet.near.org',
        mainnet: 'https://rpc.mainnet.near.org',
    },
};

export type Cluster = 'mainnet' | 'testnet' | 'betanet';

/**
 * Retrieves the RPC API URL for the specified cluster
 */
export const clusterApiUrl = (cluster?: Cluster, tls?: boolean): string => {
    const key = tls === false ? 'http' : 'https';

    if (!cluster) {
        return endpoint[key]['testnet'];
    }

    const url = endpoint[key][cluster];
    if (!url) {
        throw new Error(`Unknown ${key} cluster: ${cluster}`);
    }
    return url;
};

const helpers = {
    http: {
        testnet: 'http://wallet.testnet.near.org',
        betanet: 'http://wallet.betanet.near.org',
        mainnet: 'http://wallet.mainnet.near.org',
    },
    https: {
        testnet: 'https://wallet.testnet.near.org',
        betanet: 'https://wallet.betanet.near.org',
        mainnet: 'https://wallet.mainnet.near.org',
    },
};

/**
 * Retrieves the RPC API URL for the specified cluster
 */
export const clusterHelperUrl = (cluster?: Cluster, tls?: boolean): string => {
    const key = tls === false ? 'http' : 'https';

    if (!cluster) {
        return helpers[key]['testnet'];
    }

    const url = helpers[key][cluster];
    if (!url) {
        throw new Error(`Unknown ${key} cluster: ${cluster}`);
    }
    return url;
};
