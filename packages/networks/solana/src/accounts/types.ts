import type { AccountInfo } from '@solana/web3.js';

import type { StringPublicKey } from '@mindblox-wallet-adapter/base';

export interface ParsedAccountBase {
    pubkey: StringPublicKey;
    account: AccountInfo<Buffer>;
    info: any;
}

export type AccountParser = (pubkey: StringPublicKey, data: AccountInfo<Buffer>) => ParsedAccountBase | undefined;

export interface ParsedAccount<T> extends ParsedAccountBase {
    info: T;
}
