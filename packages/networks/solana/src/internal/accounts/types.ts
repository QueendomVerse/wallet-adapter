import type { SolanaPublicKey } from '@mindblox-wallet-adapter/base';
import type { AccountInfo, KeyedAccountInfo } from '@solana/web3.js';

import type { SailAccountLoadError } from '../../errors';

/**
 * Account id + info.
 * This is null if the account could not be found, or undefined
 * if the data is still loading.
 */
export type AccountDatum = KeyedAccountInfo | null | undefined;

/**
 * Result of the fetching of an account.
 */
export interface AccountFetchResult {
    data: AccountDatum;
    error?: SailAccountLoadError;
}

/**
 * Parsed account with additional info.
 */
export type ParsedAccountInfo<T> = {
    accountId: SolanaPublicKey;
    accountInfo: AccountInfo<T>;
    raw: Buffer;
};

export type ParsedAccountDatum<T> = ParsedAccountInfo<T> | undefined | null;
