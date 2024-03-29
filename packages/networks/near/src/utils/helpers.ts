import { decode as decodeBase58 } from 'bs58';

import { isHex, isBase58 } from '@mindblox-wallet-adapter/base';

import { fetchPublicKeys } from './helper-api';
import type { Cluster } from '../providers/connection/core/utils';
import { WalletAdapterNetwork } from '../providers/connection/core/utils';

export const isValidAccount = async (account: string) => {
    if (isValidName(account) || (await getImplicitId(account)) || (isHex(account) && account.length == 64)) {
        console.debug(`Valid near account: '${account}'`);
        return true;
    }
    console.warn(`Invalid near account: '${account}'`);
    return false;
};

export const isValidName = (name: string) => {
    if (!name || isBase58(name)) return;

    const valid = name.includes('.near') || name.includes('.testnet');
    console.debug(`Near name ${name} is valid: ${valid}`);
    return valid;
};

export const getImplicitId = async (name: string) => {
    const valid = isValidName(name);
    if (!valid) return;

    const ids = await getImplicitIdsFromName(name);
    if (!ids || ids.length < 1 || !ids[0]) return;
    console.debug(`Near name ${name} account ID is: ${ids[0]}`);

    return ids[0] ? ids[0] : undefined;
};

export const getImplicitIdsFromName = async (name: string) => {
    //@TODO parameterize
    const rpcNode = 'https://rpc.testnet.near.org';

    console.debug(`getting implicit ID for account name: '${name}'`);
    // const { wallet } = useConnect(name);
    const publicKeys = await fetchPublicKeys(rpcNode, name);

    if (!publicKeys || publicKeys.length < 1) return;

    const ids = publicKeys
        .filter(({ public_key }) => typeof public_key === 'string')
        .map(({ public_key }) => {
            if (!public_key) return;
            const id = Buffer.from(decodeBase58(public_key?.replace('ed25519:', ''))).toString('hex');
            console.debug(`got implicit ID '${id}' from public key '${public_key}'`);
            return id;
        });
    return ids;
};

export const isImplicitAddress = (address: string): boolean => isHex(address) && address.length == 64;

export const getAdapterCluster = (cluster?: string): Cluster => {
    if (!cluster) return WalletAdapterNetwork.Testnet;
    switch (cluster) {
        case 'testnet':
            return WalletAdapterNetwork.Testnet;
        case 'betanet':
            return WalletAdapterNetwork.Betanet;
        case 'mainnet':
            return WalletAdapterNetwork.Mainnet;
        default:
            return WalletAdapterNetwork.Testnet;
    }
};

export const getAdapterNetwork = (network?: string): WalletAdapterNetwork => {
    if (!network) return WalletAdapterNetwork.Testnet;
    switch (network) {
        case 'testnet':
            return WalletAdapterNetwork.Testnet;
        case 'betanet':
            return WalletAdapterNetwork.Betanet;
        case 'mainnet':
            return WalletAdapterNetwork.Mainnet;
        case 'localnet':
            return WalletAdapterNetwork.Localnet;
        default:
            return WalletAdapterNetwork.Testnet;
    }
};
