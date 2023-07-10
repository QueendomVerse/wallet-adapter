import type { WalletReadyState } from '@mindblox-wallet-adapter/base';
import type { Wallet } from '@mindblox-wallet-adapter/react';

import type { ExtendedAdapter } from '@/networks';
import type { SolanaAccount, SendSolana } from '@/networks/solana';
import type { NearAccount, SendNear } from '@/networks/near';

export const USE_SOLANA_ACCOUNT = 'USE_SOLANA_ACCOUNT';
export const USE_NEAR_ACCOUNT = 'USE_NEAR_ACCOUNT';

export interface useSolanaAccount {
    type: typeof USE_SOLANA_ACCOUNT;
    payload: SolanaAccount;
}

export interface useNearAccount {
    type: typeof USE_NEAR_ACCOUNT;
    payload: NearAccount;
}

export type useChainAccount = useSolanaAccount | useNearAccount;

export type ChainAccount = SolanaAccount | NearAccount;

export interface Solana {
    type: 'solana';
    account: SolanaAccount;
}

export interface Near {
    type: 'near';
    account: NearAccount;
}

export type Account = Solana | Near;

export interface UseAccount<T extends Account> {
    type: T['type'];
    object?: T;
    account: ChainAccount;
}

export enum Accounts {
    SOL = 'solana',
    NEAR = 'near',
}

export type Send = SendSolana | SendNear;

export interface ExtendedWallet extends Wallet {
    adapter: ExtendedAdapter;
    readyState: WalletReadyState;
}
