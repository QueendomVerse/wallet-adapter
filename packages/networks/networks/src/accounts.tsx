import type { ChainTicker, SolanaPublicKey } from '@mindblox-wallet-adapter/base';
import { ChainTickers } from '@mindblox-wallet-adapter/base';
import type {
    AccountConnection as SolanaAccountConnection,
    AccountsProviderProps as SolanaAccountsProviderProps,
    IAccountsContext as ISolanaAccountsContext,
    NativeAccount as SolanaNativeAccount,
    MintConnection as SolanaMintConnection,
    MintAccount as SolanaMintAccount,
    UserAcounts as SolanaUserAccounts,
} from '@mindblox-wallet-adapter/solana';
import {
    useAccounts as useSolanaAccounts,
    useAccountByMint as useSolanaAccountByMint,
    useNativeAccount as useSolanaNativeAccount,
    useUserAccounts as useSolanaUserAccounts,
    useMint as useSolanaMint,
    usePublicAccount as useSolanaPublicAccount,
    // AccountsProvider as SolanaAccountsProvider,
} from '@mindblox-wallet-adapter/solana';

type IAccountsContext = ISolanaAccountsContext;
type AccountConnection = SolanaAccountConnection;
type AccountsProviderProps = SolanaAccountsProviderProps;
type MintConnection = SolanaMintConnection;
type MintAccount = SolanaMintAccount;
type PublicKey = SolanaPublicKey;
type NativeAccount = SolanaNativeAccount;

type UserAccounts = SolanaUserAccounts;

export const useAccounts = (chain: ChainTicker): IAccountsContext | null => {
    switch (chain) {
        case ChainTickers.SOL:
            return useSolanaAccounts();
        case ChainTickers.NEAR:
            return null;
        default:
            return null;
    }
};

export const useMint = (chain: ChainTicker, pubKey?: string | PublicKey): MintConnection | null => {
    switch (chain) {
        case ChainTickers.SOL:
            return useSolanaMint(pubKey);
        case ChainTickers.NEAR:
            return null;
        default:
            return null;
    }
};

export const usePublicAccount = (chain: ChainTicker, pubKey?: PublicKey): AccountConnection | null => {
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

export const useNativeAccount = (chain: ChainTicker): NativeAccount | null => {
    switch (chain) {
        case ChainTickers.SOL:
            return useSolanaNativeAccount();
        case ChainTickers.NEAR:
            return null;
        default:
            return null;
    }
};

export const useUserAccounts = (chain: ChainTicker): UserAccounts | null => {
    switch (chain) {
        case ChainTickers.SOL:
            return useSolanaUserAccounts();
        case ChainTickers.NEAR:
            return null;
        default:
            return null;
    }
};

export const useAccountByMint = (chain: ChainTicker, mint?: PublicKey): MintAccount | null => {
    switch (chain) {
        case ChainTickers.SOL:
            return useSolanaAccountByMint(mint);
        case ChainTickers.NEAR:
            return null;
        default:
            return null;
    }
};
