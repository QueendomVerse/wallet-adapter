import type BN from 'bn.js';
import type { Account } from 'near-api-js';

export interface Commitment {
    block: number;
}

export interface TransactionResult {
    status: string;
    transaction: any;
}

export interface TransactionParams {
    sender: Account;
    receiver: string;
    amount: BN;
}

export interface SendTransactionsParams {
    sender: Account;
    receiver: string;
    actions: any[];
    gas: string;
}

export interface SimulationResult {
    gas_burnt: string;
    logs: string[];
    receipt_ids: string[];
    status: string;
}
