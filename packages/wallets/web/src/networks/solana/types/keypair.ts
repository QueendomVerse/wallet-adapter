import type { Keypair } from '@solana/web3.js';

export interface SolanaKeypair {
    keypair: Keypair;
}

export type StringPublicKey = string;
