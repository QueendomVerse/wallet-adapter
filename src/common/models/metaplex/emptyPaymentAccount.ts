import {
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import { serialize } from "borsh";

import {
  EmptyPaymentAccountArgs,
  getAuctionWinnerTokenTypeTracker,
  getPayoutTicket,
  getSafetyDepositConfig,
  SCHEMA,
} from ".";
import { emptyKey } from "../../constants";
import { programIds, StringPublicKey, toPublicKey } from "../../utils";

export async function emptyPaymentAccount(
  acceptPayment: StringPublicKey,
  destination: StringPublicKey,
  auctionManager: StringPublicKey,
  metadata: StringPublicKey,
  masterEdition: StringPublicKey | undefined,
  safetyDepositBox: StringPublicKey,
  vault: StringPublicKey,
  auction: StringPublicKey,
  payer: StringPublicKey,
  recipient: StringPublicKey,
  winningConfigIndex: number | null,
  winningConfigItemIndex: number | null,
  creatorIndex: number | null,
  instructions: TransactionInstruction[]
) {
  const PROGRAM_IDS = programIds();
  const store = PROGRAM_IDS.store;
  if (!store) {
    throw new Error("Store not initialized");
  }

  const safetyDepositConfig = await getSafetyDepositConfig(
    auctionManager,
    safetyDepositBox
  );

  const tokenTracker = await getAuctionWinnerTokenTypeTracker(auctionManager);

  const value = new EmptyPaymentAccountArgs({
    winningConfigIndex,
    winningConfigItemIndex,
    creatorIndex,
  });

  const data = Buffer.from(serialize(SCHEMA, value));

  const payoutTicket = await getPayoutTicket(
    auctionManager,
    winningConfigIndex,
    winningConfigItemIndex,
    creatorIndex,
    safetyDepositBox,
    recipient
  );

  const keys = [
    {
      pubkey: toPublicKey(acceptPayment),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(destination),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(auctionManager),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: payoutTicket ? toPublicKey(payoutTicket) : emptyKey,
      isSigner: false,
      isWritable: true,
    },
    {
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
      pubkey: toPublicKey(masterEdition || SystemProgram.programId),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: safetyDepositBox ? toPublicKey(safetyDepositBox) : emptyKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(store),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(vault),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(auction),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: PROGRAM_IDS.token,
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
      pubkey: tokenTracker ? toPublicKey(tokenTracker) : emptyKey,
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
