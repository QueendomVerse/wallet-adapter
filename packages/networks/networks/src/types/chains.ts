import type { SolanaConnectionContextState, NearConnectionContextState } from '..';

// Context States
export type ChainConnectionContextState = SolanaConnectionContextState | NearConnectionContextState;

export type ChainConnectionContextStateMap = {
    SOL: SolanaConnectionContextState;
    NEAR: NearConnectionContextState;
};
