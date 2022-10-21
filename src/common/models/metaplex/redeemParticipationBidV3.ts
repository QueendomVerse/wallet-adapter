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
  RedeemParticipationBidV3Args,
  SCHEMA,
  getPrizeTrackingTicket,
  getSafetyDepositConfig,
} from ".";
import { emptyKey } from "../../constants";
import {
  getAuctionExtended,
  getEdition,
  getEditionMarkPda,
  getMetadata,
} from "../../actions";
import { programIds, StringPublicKey, toPublicKey } from "../../utils";

export async function redeemParticipationBidV3(
  vault: StringPublicKey,
  safetyDepositTokenStore: StringPublicKey,
  destination: StringPublicKey,
  safetyDeposit: StringPublicKey,
  bidder: StringPublicKey,
  payer: StringPublicKey,
  metadata: StringPublicKey,
  masterEdition: StringPublicKey,
  originalMint: StringPublicKey,
  transferAuthority: StringPublicKey,
  acceptPaymentAccount: StringPublicKey,
  tokenPaymentAccount: StringPublicKey,
  newMint: StringPublicKey,
  edition: BN,
  winIndex: BN | null,
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

  const auctionDataExtended = await getAuctionExtended({
    auctionProgramId: PROGRAM_IDS.auction,
    resource: vault,
  });

  const bidderKeys = await getBidderKeys(auctionKey, bidder);
  if (!bidderKeys) return;
  const { bidRedemption, bidMetadata } = bidderKeys;

  const prizeTrackingTicket = await getPrizeTrackingTicket(
    auctionManagerKey,
    originalMint
  );

  const newMetadata = await getMetadata(newMint);
  const newEdition = await getEdition(newMint);

  const editionMarkPda = await getEditionMarkPda(originalMint, edition);

  const safetyDepositConfig = await getSafetyDepositConfig(
    auctionManagerKey,
    safetyDeposit
  );

  const value = new RedeemParticipationBidV3Args({ winIndex });
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
      isWritable: true,
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
      pubkey: auctionDataExtended ? toPublicKey(auctionDataExtended) : emptyKey,
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