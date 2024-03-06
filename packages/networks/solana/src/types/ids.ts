import { PublicKey as SolanaPublicKey} from "@solana/web3.js";
import type { AccountInfo } from '@solana/web3.js';

import type { StringPublicKey } from '@mindblox-wallet-adapter/base';

export interface PublicKeyStringAndAccount<T> {
    pubkey: string;
    account: AccountInfo<T>;
}

export const WRAPPED_SOL_MINT = new SolanaPublicKey('So11111111111111111111111111111111111111112');
export const TOKEN_PROGRAM_ID = new SolanaPublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new SolanaPublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
);
export const BPF_UPGRADE_LOADER_ID = new SolanaPublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
export const MEMO_ID = new SolanaPublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
export const METADATA_PROGRAM_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' as StringPublicKey;
export const VAULT_ID = 'vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn' as StringPublicKey;
export const AUCTION_ID = 'auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8' as StringPublicKey;
export const METAPLEX_ID = 'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98' as StringPublicKey;
export const PACK_CREATE_ID = new SolanaPublicKey('packFeFNZzMfD9aVWL7QbGz1WcU7R9zpf6pvNsw2BLu');
export const ORACLE_ID = new SolanaPublicKey('rndshKFf48HhGaPbaCd3WQYtgCNKzRgVQ3U2we4Cvf9');
export const SYSTEM = new SolanaPublicKey('11111111111111111111111111111111');
