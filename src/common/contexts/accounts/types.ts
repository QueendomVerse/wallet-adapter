import { AccountInfo } from "@solana/web3.js";
// import { BidRedemptionTicket } from '@metaplex-foundation/mpl-metaplex';
import { StringPublicKey } from "../../utils";

export interface ParsedAccountBase {
  pubkey: StringPublicKey;
  account: AccountInfo<Buffer>;
  // info: BidRedemptionTicket;
  info: any;
}

export type AccountParser = (
  pubkey: StringPublicKey,
  data: AccountInfo<Buffer>
) => ParsedAccountBase | undefined;

//@ts-ignore
export interface ParsedAccount<T> extends ParsedAccountBase {
  info: T;
}
