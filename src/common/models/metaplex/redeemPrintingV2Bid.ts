import {
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import { serialize } from "borsh";

import {
  getAuctionKeys,
  getBidderKeys,
  RedeemPrintingV2BidArgs,
  getPrizeTrackingTicket,
  SCHEMA,
  getSafetyDepositConfig,
} from ".";
import { emptyKey } from "../../constants";
import {
  getEdition,
  getEditionMarkPda,
  getMetadata,
  getAuctionExtended,
} from "../../actions";
import { programIds, StringPublicKey, toPublicKey } from "../../utils";

export async function redeemPrintingV2Bid(
  vault: StringPublicKey,
  safetyDepositTokenStore: StringPublicKey,
  tokenAccount: StringPublicKey,
  safetyDeposit: StringPublicKey,
  bidder: StringPublicKey,
  payer: StringPublicKey,
  metadata: StringPublicKey,
  masterEdition: StringPublicKey,
  originalMint: StringPublicKey,
  newMint: StringPublicKey,
  edition: BN,
  editionOffset: BN,
  winIndex: BN,
  instructions: TransactionInstruction[]
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

  const prizeTrackingTicket = await getPrizeTrackingTicket(
    auctionManagerKey,
    originalMint
  );

  const safetyDepositConfig = await getSafetyDepositConfig(
    auctionManagerKey,
    safetyDeposit
  );

  const newMetadata = await getMetadata(newMint);
  const newEdition = await getEdition(newMint);

  const editionMarkPda = await getEditionMarkPda(originalMint, edition);

  const value = new RedeemPrintingV2BidArgs({ editionOffset, winIndex });
  const data = Buffer.from(serialize(SCHEMA, value));
  const extended = await getAuctionExtended({
    auctionProgramId: PROGRAM_IDS.auction,
    resource: vault,
  });
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
      pubkey: toPublicKey(tokenAccount),
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
      isWritable: true,
    },
    {
      pubkey: toPublicKey(vault),
      isSigner: false,
      isWritable: true,
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
      isWritable: false,
    },
    {
      pubkey: toPublicKey(payer),
      isSigner: true,
      isWritable: true,
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
      pubkey: prizeTrackingTicket ? toPublicKey(prizeTrackingTicket) : emptyKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: newMetadata ? toPublicKey(newMetadata) : emptyKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: newEdition ? toPublicKey(newEdition) : emptyKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(masterEdition),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(newMint),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: editionMarkPda ? toPublicKey(editionMarkPda) : emptyKey,
      isSigner: false,
      isWritable: true,
    },
    {
      // Mint authority (this) is going to be the payer since the bidder
      // may not be signer hre - we may be redeeming for someone else (permissionless)
      // and during the txn, mint authority is removed from us and given to master edition.
      // The ATA account is already owned by bidder by default. No signing needed
      pubkey: toPublicKey(payer),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: metadata ? toPublicKey(metadata) : emptyKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: extended ? toPublicKey(extended) : emptyKey,
      isSigner: false,
      isWritable: false,
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
