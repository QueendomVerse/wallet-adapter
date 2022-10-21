import {
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import { serialize } from "borsh";

import { getAuctionKeys, getOriginalAuthority, SCHEMA } from ".";
import { emptyKey } from "../../constants";
import { programIds, StringPublicKey, toPublicKey } from "../../utils";
import {
  getSafetyDepositBoxValidationTicket,
  DeprecatedValidateSafetyDepositBoxV1Args,
} from "./deprecatedStates";

export async function deprecatedValidateSafetyDepositBoxV1(
  vault: StringPublicKey,
  metadata: StringPublicKey,
  safetyDepositBox: StringPublicKey,
  safetyDepositTokenStore: StringPublicKey,
  tokenMint: StringPublicKey,
  auctionManagerAuthority: StringPublicKey,
  metadataAuthority: StringPublicKey,
  payer: StringPublicKey,
  instructions: TransactionInstruction[],
  edition: StringPublicKey,
  allowedCreator: StringPublicKey | undefined,
  store: StringPublicKey,
  printingMint?: StringPublicKey,
  printingMintAuthority?: StringPublicKey
) {
  const PROGRAM_IDS = programIds();

  const auctionKeys = await getAuctionKeys(vault);
  if (!auctionKeys) return;
  const { auctionKey, auctionManagerKey } = auctionKeys;

  const originalAuthorityLookup = await getOriginalAuthority(
    auctionKey,
    metadata
  );

  const value = new DeprecatedValidateSafetyDepositBoxV1Args();

  const data = Buffer.from(serialize(SCHEMA, value));

  const safetyDepositBoxValidationTicketResult =
    await getSafetyDepositBoxValidationTicket(
      auctionManagerKey,
      safetyDepositBox
    );
  const keys = [
    {
      pubkey: safetyDepositBoxValidationTicketResult
        ? toPublicKey(safetyDepositBoxValidationTicketResult)
        : emptyKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(auctionManagerKey),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: metadata ? toPublicKey(metadata) : emptyKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: originalAuthorityLookup
        ? toPublicKey(originalAuthorityLookup)
        : emptyKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(allowedCreator || SystemProgram.programId),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(store),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: safetyDepositBox ? toPublicKey(safetyDepositBox) : emptyKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: safetyDepositTokenStore
        ? toPublicKey(safetyDepositTokenStore)
        : emptyKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: tokenMint ? toPublicKey(tokenMint) : emptyKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: edition ? toPublicKey(edition) : emptyKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(vault),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(auctionManagerAuthority),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(metadataAuthority),
      isSigner: true,
      isWritable: false,
    },

    {
      pubkey: toPublicKey(payer),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(PROGRAM_IDS.metadata),
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
  ];

  if (printingMint && printingMintAuthority) {
    keys.push({
      pubkey: toPublicKey(printingMint),
      isSigner: false,
      isWritable: true,
    });

    keys.push({
      pubkey: toPublicKey(printingMintAuthority),
      isSigner: true,
      isWritable: false,
    });
  }
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(PROGRAM_IDS.metaplex),
      data,
    })
  );
}
