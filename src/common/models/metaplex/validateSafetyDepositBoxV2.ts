import {
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import { serialize } from "borsh";

import {
  getAuctionKeys,
  getAuctionWinnerTokenTypeTracker,
  getOriginalAuthority,
  getSafetyDepositConfig,
  SafetyDepositConfig,
  SCHEMA,
  ValidateSafetyDepositBoxV2Args,
} from ".";
import { emptyKey } from "../../constants";
import { programIds, toPublicKey, StringPublicKey } from "../../utils";

export async function validateSafetyDepositBoxV2(
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
  safetyDepositConfig: SafetyDepositConfig
) {
  // console.warn('func: validateSafetyDepositBoxV2');

  const PROGRAM_IDS = programIds();

  const auctionKeys = await getAuctionKeys(vault);
  if (!auctionKeys) return;
  const { auctionKey, auctionManagerKey } = auctionKeys;

  const originalAuthorityLookup = await getOriginalAuthority(
    auctionKey,
    metadata
  );

  const safetyDepositConfigKey = await getSafetyDepositConfig(
    auctionManagerKey,
    safetyDepositBox
  );

  const tokenTracker = await getAuctionWinnerTokenTypeTracker(
    auctionManagerKey
  );

  const value = new ValidateSafetyDepositBoxV2Args(safetyDepositConfig);
  const data = Buffer.from(serialize(SCHEMA, value));

  console.info("safetyDepositConfigKey");
  console.info(safetyDepositConfigKey, safetyDepositConfigKey ? "what " : "no");
  console.info(emptyKey);
  console.info("metadata");
  console.dir(metadata);
  console.info("auctionManagerKey");
  console.dir(auctionManagerKey);
  const keys = [
    {
      pubkey: safetyDepositConfigKey
        ? toPublicKey(safetyDepositConfigKey)
        : emptyKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: tokenTracker ? toPublicKey(tokenTracker) : emptyKey,
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
  console.warn("keys");
  console.dir(keys);
  console.info("PROGRAM_IDS.metaplex", PROGRAM_IDS.metaplex);

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(PROGRAM_IDS.metaplex),
      data,
    })
  );
}
