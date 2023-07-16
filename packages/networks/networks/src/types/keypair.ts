import type { SolanaKeypair } from '@mindblox-wallet-adapter/solana';
import type { NearKeypair } from '@mindblox-wallet-adapter/near';

export type Keypair = SolanaKeypair | NearKeypair;
