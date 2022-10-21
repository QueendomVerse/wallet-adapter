import { SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { serialize } from "borsh";

import {
  getAuctionKeys,
  WithdrawMasterEditionArgs,
  SCHEMA,
  getPrizeTrackingTicket,
  getSafetyDepositConfig,
} from ".";
import { emptyKey } from "../../constants";
import { AUCTION_PREFIX, EXTENDED, VAULT_PREFIX } from "../../actions";
import {
  findProgramAddress,
  programIds,
  toPublicKey,
  StringPublicKey,
} from "../../utils";

export async function withdrawMasterEdition(
  vault: StringPublicKey,
  safetyDepositTokenStore: StringPublicKey,
  destination: StringPublicKey,
  safetyDeposit: StringPublicKey,
  fractionMint: StringPublicKey,
  mint: StringPublicKey,
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

  const prizeTrackingTicket = await getPrizeTrackingTicket(
    auctionManagerKey,
    mint
  );
  const vaultAuthorityResult = await findProgramAddress(
    [
      Buffer.from(VAULT_PREFIX),
      toPublicKey(PROGRAM_IDS.vault).toBuffer(),
      toPublicKey(vault).toBuffer(),
    ],
    toPublicKey(PROGRAM_IDS.vault)
  );
  if (!vaultAuthorityResult || vaultAuthorityResult.length < 1) return;
  const vaultAuthority = vaultAuthorityResult[0];

  const auctionExtendedResult = await findProgramAddress(
    [
      Buffer.from(AUCTION_PREFIX),
      toPublicKey(PROGRAM_IDS.auction).toBuffer(),
      toPublicKey(vault).toBuffer(),
      Buffer.from(EXTENDED),
    ],
    toPublicKey(PROGRAM_IDS.auction)
  );
  if (!auctionExtendedResult || auctionExtendedResult.length < 1) return;
  const auctionExtended = auctionExtendedResult[0];

  const safetyDepositConfig = await getSafetyDepositConfig(
    auctionManagerKey,
    safetyDeposit
  );

  const value = new WithdrawMasterEditionArgs();
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
      pubkey: toPublicKey(fractionMint),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: prizeTrackingTicket ? toPublicKey(prizeTrackingTicket) : emptyKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(vaultAuthority),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(auctionKey),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(auctionExtended),
      isSigner: false,
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
      pubkey: toPublicKey(store),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: safetyDepositConfig ? toPublicKey(safetyDepositConfig) : emptyKey,
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
