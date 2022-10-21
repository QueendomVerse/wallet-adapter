import { WalletName } from "../../contexts/connection/networks/core/base";
import { Wallet as DbWallet } from "../../localDB/db";
import { KeyPair as lKeypair } from "../../store/types/webWalletTypes";
import { SolanaAccount as UseSolanaAccount } from "../../contexts/connection/networks/solana";
import { NearAccount as UseNearAccount } from "../../contexts/connection/networks/near";

export const USE_SOLANA_ACCOUNT = "USE_SOLANA_ACCOUNT";
export const USE_NEAR_ACCOUNT = "USE_NEAR_ACCOUNT";

export interface useSolanaAccount {
  type: typeof USE_SOLANA_ACCOUNT;
  payload: UseSolanaAccount;
}

export interface useNearAccount {
  type: typeof USE_NEAR_ACCOUNT;
  payload: UseNearAccount;
}

export type UseAccountTypes = useSolanaAccount | useNearAccount;

export type UseAccounts = UseSolanaAccount | UseNearAccount;

export interface Solana {
  type: "solana";
  account: UseSolanaAccount;
}

export interface Near {
  type: "near";
  account: UseNearAccount;
}

export type Account = Solana | Near;

export interface UseAccount<T extends Account> {
  type: T["type"];
  object?: T;
  account: UseAccounts;
}

export enum Accounts {
  SOL = "solana",
  NEAR = "near",
}

export interface SelectedWallet {
  name: WalletName;
  wallet: DbWallet;
  keypair: lKeypair;
}
