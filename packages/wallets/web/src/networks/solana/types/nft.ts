import type BN from 'bn.js';
import type { MasterEditionV2, Metadata } from './metadata';
import type { SafetyDepositBox } from './vault';

export interface Account {
    // data: any[];
    data: Buffer[];
    executable: boolean;
    lamports: number;
    owner: string;
    rentEpock: number;
}

export interface ItemMetadata {
    account: Account;
    info: Metadata;
    pubkey: string;
}

export interface MasterEdition {
    account: Account;
    info: MasterEditionV2;
    pubkey: string;
}

export interface SafetyDeposit {
    account: Account;
    info: SafetyDepositBox;
    pubkey: string;
}

// AuctionViewItem
export interface Item {
    amount: BN;
    masterEdition: MasterEdition;
    metadata: ItemMetadata;
    safetyDeposit: SafetyDeposit;
    winningConfigType: number;
}

export interface RpcMetadata {}
