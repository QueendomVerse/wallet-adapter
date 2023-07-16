import type { AccountInfo } from '@solana/web3.js';
import type { AccountInfo as TokenAccountInfo } from '@solana/spl-token';

export interface TokenAccount {
    pubkey: string;
    account: AccountInfo<Buffer>;
    info: TokenAccountInfo;
}
