import BN from 'bn.js';

interface Config {
    networkId: string;
    nodeUrl: string;
    archivalRpcUrl: string;
    walletUrl: string;
    helperUrl: string;
    explorerUrl: string;
    multisafeFactoryId: string;
    multisafeContractHashes: string[];
    backendURL: string;
}

const general = {
    maxGas: new BN(300000000000000),
    endpoint: {
        jsonrpc: '2.0',
        id: 'viewacct',
        method: 'query',
        setParams({ account_id }: { account_id: string }) {
            return { ...this, params: { request_type: 'view_account', finality: 'final', account_id } };
        },
    },
    multisafe: {
        deleteRequestCooldown: 15 * 60 * 1000, // 15 minutes in milliseconds
    },
    gas: {
        default: '100000000000000', // 100 TGas
        add_and_confirm: '40000000000000', // 40 TGas
        two_calls: '80000000000000', // 80 TGas
        transfer: '30000000000000', // 30 TGas
        storage_deposit: '1250000000000000000000', // yoctoNear
        storage_deposit_large: '12500000000000000000000', // yoctoNear: nUSDC, nUSDT require minimum 0.0125 NEAR. Came to this conclusion using trial and error.
        storage_gas: '30000000000000', // 30 TGas
    },
};

const testnet = {
    networkId: 'testnet',
    nodeUrl: 'https://rpc.testnet.near.org',
    archivalRpcUrl: 'https://archival-rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://testnet-api.kitwallet.app',
    explorerUrl: 'https://explorer.testnet.near.org',
    multisafeFactoryId: 'multisafe.testnet',
    multisafeContractHashes: ['EPGksnjsxBjaZkXp63ZqdXK9bFpUzrn4UfW8FrehhRQT'],
    backendURL: process.env.REACT_APP_BACKEND_URL_TESTNET || 'http://localhost:8666',
};

const mainnet = {
    networkId: 'mainnet',
    nodeUrl: 'https://rpc.mainnet.near.org',
    archivalRpcUrl: 'https://archival-rpc.mainnet.near.org',
    walletUrl: 'https://wallet.near.org',
    helperUrl: 'https://api.kitwallet.app',
    explorerUrl: 'https://explorer.near.org',
    multisafeFactoryId: 'multisafe.near',
    multisafeContractHashes: ['EPGksnjsxBjaZkXp63ZqdXK9bFpUzrn4UfW8FrehhRQT'],
    backendURL: process.env.REACT_APP_BACKEND_URL_MAINNET || 'http://localhost:8666',
};

const configs = (network: string) => {
    switch (network) {
        case 'testnet':
            return testnet;
        case 'mainnet':
            return mainnet;
        default:
            return testnet;
    }
};

const createHelpers = (config: Config) => ({
    getCheckAccountInExplorerUrl: (accountId: string) => `${config.explorerUrl}/accounts/${accountId}`,
    getCheckTransactionInExplorerUrl: (transactionHash: string) =>
        `${config.explorerUrl}/transactions/${transactionHash}`,
});

const getNearConfig = (network = 'testnet') => {
    const config: Config = configs(network);
    return {
        ...general,
        ...config,
        ...createHelpers(config),
    };
};

export const config = getNearConfig(process.env.REACT_APP_NETWORK);
