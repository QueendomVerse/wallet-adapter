import type { ChainTicker, SolanaPublicKey } from '@mindblox-wallet-adapter/base';
import { ChainTickers } from '@mindblox-wallet-adapter/base';
import type {
    ParsedAccountBase as ParsedSolanaAccountBase,
    // AccountsProviderProps as SolanaAccountsProviderProps,
    IAccountsContext as ISolanaAccountsContext,
    NativeAccount as SolanaNativeAccount,
    MintAccount as SolanaMintAccount,
    // MintAccount as SolanaMintAccount,
    UserAcounts as SolanaUserAccounts,
    TokenAccount as SolanaTokenAccount,
    SolanaMint
} from '@mindblox-wallet-adapter/solana';
import {
    useAccounts as useSolanaAccounts,
    useTokenAccountByMint as useSolanaTokenAccountByMint,
    useNativeAccount as useSolanaNativeAccount,
    useUserAccounts as useSolanaUserAccounts,
    useMint as useSolanaMint,
    useMintAccount as useSolanaMintAccount,
    usePublicAccount as useSolanaPublicAccount,
    // AccountsProvider as SolanaAccountsProvider,
} from '@mindblox-wallet-adapter/solana';

export type IAccountsContext = ISolanaAccountsContext;
export type ParsedAccountBase = ParsedSolanaAccountBase;
// type AccountsProviderProps = SolanaAccountsProviderProps;
export type MintAccount = SolanaMintAccount;
export type Mint = SolanaMint
export type TokenAccount = SolanaTokenAccount;
export type PublicKey = SolanaPublicKey;
export type NativeAccount = SolanaNativeAccount;

export type UserAccounts = SolanaUserAccounts;

export const useAccounts = (chain?: ChainTicker): IAccountsContext | null => {
    switch (chain) {
        case ChainTickers.SOL:
            return useSolanaAccounts();
        case ChainTickers.NEAR:
            return null;
        default:
            return null;
    }
};

export const useMintAccount = (chain?: ChainTicker, pubKey?: string | PublicKey): MintAccount | null | undefined=> {
    switch (chain) {
        case ChainTickers.SOL:
            return useSolanaMintAccount(pubKey);
        case ChainTickers.NEAR:
            return null;
        default:
            return null;
    }
};

export const useMint = (chain?: ChainTicker, pubKey?: string | PublicKey): Mint | null | undefined=> {
    switch (chain) {
        case ChainTickers.SOL:
            return useSolanaMint(pubKey);
        case ChainTickers.NEAR:
            return null;
        default:
            return null;
    }
};

export const usePublicAccount = (chain?: ChainTicker, pubKey?: PublicKey): ParsedAccountBase | null | undefined => {
    switch (chain) {
        case ChainTickers.SOL:
            return useSolanaPublicAccount(pubKey);
        case ChainTickers.NEAR:
            return null;
        default:
            return null;
    }
};

// export const AccountsProvider = ({ children = null }: AccountsProviderProps) => {
//     switch (chain) {
//         case ChainTickers.SOL:
//             return <SolanaAccountsProvider>{children}</SolanaAccountsProvider>;
//         case ChainTickers.NEAR:
//             return null;
//         default:
//             return null;
//     }
// };

export const useNativeAccount = (chain?: ChainTicker): NativeAccount | null => {
    switch (chain) {
        case ChainTickers.SOL:
            return useSolanaNativeAccount();
        case ChainTickers.NEAR:
            return null;
        default:
            return null;
    }
};

export const useUserAccounts = (chain?: ChainTicker): UserAccounts | null => {
    switch (chain) {
        case ChainTickers.SOL:
            return useSolanaUserAccounts();
        case ChainTickers.NEAR:
            return null;
        default:
            return null;
    }
};

export const useTokenAccountByMint = (chain?: ChainTicker, mint?: PublicKey): TokenAccount | null | undefined => {
    switch (chain) {
        case ChainTickers.SOL:
            return useSolanaTokenAccountByMint(mint);
        case ChainTickers.NEAR:
            return null;
        default:
            return null;
    }
};
