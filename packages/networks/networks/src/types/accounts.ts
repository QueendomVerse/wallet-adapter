import type { SolanaAccount, NearAccount, SendSolana, SendNear } from '..';

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

interface Solana {
    type: 'solana';
    account: SolanaAccount;
}

interface Near {
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
