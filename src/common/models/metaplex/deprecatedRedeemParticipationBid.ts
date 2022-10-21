import {
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import { serialize } from "borsh";

import {
  getAuctionKeys,
  getBidderKeys,
  SCHEMA,
  getSafetyDepositConfig,
} from ".";
import { emptyKey } from "../../constants";
import { programIds, StringPublicKey, toPublicKey } from "../../utils";
import { DeprecatedRedeemParticipationBidArgs } from "./deprecatedStates";

export async function deprecatedRedeemParticipationBid(
  vault: StringPublicKey,
  safetyDepositTokenStore: StringPublicKey,
  destination: StringPublicKey,
  safetyDeposit: StringPublicKey,
  bidder: StringPublicKey,
  payer: StringPublicKey,
  instructions: TransactionInstruction[],
  participationPrintingAccount: StringPublicKey,
  transferAuthority: StringPublicKey,
  acceptPaymentAccount: StringPublicKey,
  tokenPaymentAccount: StringPublicKey
) {
  const PROGRAM_IDS = programIds();
  const store = PROGRAM_IDS.store;
  if (!store) {
    throw new Error("Store not initialized");
  }

  const auctionKeys = await getAuctionKeys(vault);
  if (!auctionKeys) return;
  const { auctionKey, auctionManagerKey } = auctionKeys;

  const bidderKeys = await getBidderKeys(auctionKey, bidder);
  if (!bidderKeys) return;
  const { bidRedemption, bidMetadata } = bidderKeys;

  const safetyDepositConfig = await getSafetyDepositConfig(
    auctionManagerKey,
    safetyDeposit
  );

  const value = new DeprecatedRedeemParticipationBidArgs();
  const data = Buffer.from(serialize(SCHEMA, value));
  const keys = [
    {
      pubkey: toPublicKey(auctionManagerKey),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: safetyDepositTokenStore
        ? toPublicKey(safetyDepositTokenStore)
        : emptyKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(destination),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(bidRedemption),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(safetyDeposit),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(vault),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: safetyDepositConfig ? toPublicKey(safetyDepositConfig) : emptyKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(auctionKey),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(bidMetadata),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(bidder),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(payer),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: PROGRAM_IDS.token,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(PROGRAM_IDS.vault),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(PROGRAM_IDS.metadata),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: store,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(transferAuthority),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(acceptPaymentAccount),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(tokenPaymentAccount),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(participationPrintingAccount),
      isSigner: false,
      isWritable: true,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(PROGRAM_IDS.metaplex),
      data,
    })
  );
}
