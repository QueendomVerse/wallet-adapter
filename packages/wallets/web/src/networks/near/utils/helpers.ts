import { decode as decodeBs58 } from 'bs58';

import { isBase58, isHex } from '@mindblox-wallet-adapter/base';
import { fetchPublicKeys } from './helper-api';

export const isValidAccount = async (account: string) => {
    if (isValidNearName(account) || (await getImplicitId(account)) || (isHex(account) && account.length == 64)) {
        console.debug(`Valid near account: '${account}'`);
        return true;
    }
    console.warn(`Invalid near account: '${account}'`);
    return false;
};

export const isValidNearName = (name: string) => {
    if (!name || isBase58(name)) return;

    const valid = name.includes('.near') || name.includes('.testnet');
    console.debug(`Near name ${name} is valid: ${valid}`);
    return valid;
};

export const getImplicitId = async (name: string) => {
    const valid = isValidNearName(name);
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
            const id = Buffer.from(decodeBs58(public_key?.replace('ed25519:', ''))).toString('hex');
            console.debug(`got implicit ID '${id}' from public key '${public_key}'`);
            return id;
        });
    return ids;
};

export const isImplicitAddress = (address: string): boolean => isHex(address) && address.length == 64;
