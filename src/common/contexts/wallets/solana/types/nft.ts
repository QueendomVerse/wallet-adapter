import BN from "bn.js";
import {
  Metadata,
  SafetyDepositBox,
  // ParsedAccount,
  MasterEditionV2,
  // Edition,
  // Creator,
} from "../../../..";
// import {
//   Connection,
//   PublicKey,
//   Transaction,
//   Account,
//   SystemProgram,
// } from '@solana/web3.js';

export interface Account {
  data: any[];
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
