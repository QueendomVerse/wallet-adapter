import type { AccountInfo } from '@solana/web3.js';
import type { MintInfo } from '@solana/spl-token';

import type { SolanaConnection } from '@mindblox-wallet-adapter/base';
import { SolanaPublicKey } from '@mindblox-wallet-adapter/base';

import type { ParsedAccountBase, AccountParser } from './types';
import { deserializeMint } from './deserialize';

import type { TokenAccount } from '../types';
import { AccountEmitter } from './emitter';

export const genericCache = new Map<string, ParsedAccountBase>();
const mintCache = new Map<string, MintInfo>();
const pendingCalls = new Map<string, Promise<ParsedAccountBase>>();
const pendingMintCalls = new Map<string, Promise<MintInfo>>();

const keyToAccountParser = new Map<string, AccountParser>();

const getMintInfo = async (connection: SolanaConnection, pubKey: SolanaPublicKey) => {
    const info = await connection.getAccountInfo(pubKey);
    if (info === null) {
        throw new Error('Failed to find mint account');
    }

    const data = Buffer.from(info.data);

    return deserializeMint(data);
};

export const cache = {
    emitter: new AccountEmitter(),
    query: async (connection: SolanaConnection, pubKey: string | SolanaPublicKey, parser?: AccountParser) => {
        let id: SolanaPublicKey;
        if (typeof pubKey === 'string') {
            id = new SolanaPublicKey(pubKey);
        } else {
            id = pubKey;
        }

        const address = id.toBase58();

        const account = genericCache.get(address);
        if (account) {
            return account;
        }

        let query = pendingCalls.get(address);
        if (query) {
            return query;
        }

        // TODO: refactor to use multiple accounts query with flush like behavior
        query = connection.getAccountInfo(id).then((data) => {
            if (!data) {
                throw new Error('Account not found');
            }

            return cache.add(id, data, parser);
        }) as Promise<TokenAccount>;
        pendingCalls.set(address, query as any);

        return query;
    },

    add: (
        id: SolanaPublicKey | string,
        obj: AccountInfo<Buffer>,
        parser?: AccountParser,
        isActive?: boolean | undefined | ((parsed: any) => boolean)
    ) => {
        const address = typeof id === 'string' ? id : id?.toBase58();
        const deserialize = parser ? parser : keyToAccountParser.get(address);
        if (!deserialize) {
            throw new Error('Deserializer needs to be registered or passed as a parameter');
        }

        cache.registerParser(id, deserialize);
        pendingCalls.delete(address);
        const account = deserialize(address, obj);
        if (!account) {
            return;
        }

        if (isActive === undefined) isActive = true;
        else if (isActive instanceof Function) isActive = isActive(account);

        const isNew = !genericCache.has(address);

        genericCache.set(address, account);
        cache.emitter.raiseCacheUpdated(address, isNew, deserialize, isActive);
        return account;
    },
    get: (pubKey: string | SolanaPublicKey) => {
        let key: string;
        if (typeof pubKey !== 'string') {
            key = pubKey.toBase58();
        } else {
            key = pubKey;
        }

        return genericCache.get(key);
    },
    delete: (pubKey: string | SolanaPublicKey) => {
        let key: string;
        if (typeof pubKey !== 'string') {
            key = pubKey.toBase58();
        } else {
            key = pubKey;
        }

        if (genericCache.get(key)) {
            genericCache.delete(key);
            cache.emitter.raiseCacheDeleted(key);
            return true;
        }
        return false;
    },

    byParser: (parser: AccountParser) => {
        return Array.from(keyToAccountParser.keys()).filter(id => keyToAccountParser.get(id) === parser);
    },

    registerParser: (pubkey: SolanaPublicKey | string, parser: AccountParser) => {
        if (pubkey) {
            const address = typeof pubkey === 'string' ? pubkey : pubkey?.toBase58();
            keyToAccountParser.set(address, parser);
        }

        return pubkey;
    },
    queryMint: async (connection: SolanaConnection, pubKey: string | SolanaPublicKey) => {
        let id: SolanaPublicKey;
        if (typeof pubKey === 'string') {
            id = new SolanaPublicKey(pubKey);
        } else {
            id = pubKey;
        }

        const address = id.toBase58();
        const mint = mintCache.get(address);
        if (mint) {
            return mint;
        }

        let query = pendingMintCalls.get(address);
        if (query) {
            return query;
        }

        query = getMintInfo(connection, id).then((data) => {
            pendingMintCalls.delete(address);

            mintCache.set(address, data);
            return data;
        }) as Promise<MintInfo>;
        pendingMintCalls.set(address, query as any);

        return query;
    },
    getMint: (pubKey: string | SolanaPublicKey) => {
        let key: string;
        if (typeof pubKey !== 'string') {
            key = pubKey.toBase58();
        } else {
            key = pubKey;
        }

        return mintCache.get(key);
    },
    addMint: (pubKey: SolanaPublicKey, obj: AccountInfo<Buffer>) => {
        const mint = deserializeMint(obj.data);
        const id = pubKey.toBase58();
        mintCache.set(id, mint);
        return mint;
    },
};

export const getCachedAccount = (predicate: (account: TokenAccount) => boolean): TokenAccount | undefined => {
    return Array.from(genericCache.values()).find((account) => predicate(account as TokenAccount)) as TokenAccount;
};
