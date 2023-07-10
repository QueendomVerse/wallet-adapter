import type { AccountInfo } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';

import type { StringPublicKey } from '@/networks';

const PubKeysInternedMap = new Map<string, PublicKey>();

export const toPublicKey = (key: string | PublicKey | undefined): PublicKey => {
    if (!key) throw new Error('Parameter key cannot be empty!');

    return typeof key === 'string'
        ? PubKeysInternedMap.get(key) ?? (PubKeysInternedMap.set(key, new PublicKey(key)).get(key) as PublicKey)
        : key;
};

export const pubkeyToString = (key: PublicKey | null | string = ''): string =>
    typeof key === 'string' ? key : key?.toBase58() || '';

export interface PublicKeyStringAndAccount<T> {
    pubkey: string;
    account: AccountInfo<T>;
}

export const WRAPPED_SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const BPF_UPGRADE_LOADER_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
export const MEMO_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
export const METADATA_PROGRAM_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' as StringPublicKey;
export const VAULT_ID = 'vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn' as StringPublicKey;
export const AUCTION_ID = 'auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8' as StringPublicKey;
export const METAPLEX_ID = 'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98' as StringPublicKey;
export const PACK_CREATE_ID = new PublicKey('packFeFNZzMfD9aVWL7QbGz1WcU7R9zpf6pvNsw2BLu');
export const ORACLE_ID = new PublicKey('rndshKFf48HhGaPbaCd3WQYtgCNKzRgVQ3U2we4Cvf9');
export const SYSTEM = new PublicKey('11111111111111111111111111111111');
