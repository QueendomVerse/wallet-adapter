import { SYSVAR_CLOCK_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { serialize } from "borsh";

import { getAuctionKeys, ClaimBidArgs, SCHEMA } from ".";
import { emptyKey } from "../../constants";
import { getBidderPotKey, getAuctionExtended } from "../../actions";
import { programIds, StringPublicKey, toPublicKey } from "../../utils";

export async function claimBid(
  acceptPayment: StringPublicKey,
  bidder: StringPublicKey,
  bidderPotToken: StringPublicKey,
  vault: StringPublicKey,
  tokenMint: StringPublicKey,
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

  const bidderPotKey = await getBidderPotKey({
    auctionProgramId: PROGRAM_IDS.auction,
    auctionKey,
    bidderPubkey: bidder,
  });

  const value = new ClaimBidArgs();
  const data = Buffer.from(serialize(SCHEMA, value));

  const auctionExtendedKey = await getAuctionExtended({
    auctionProgramId: PROGRAM_IDS.auction,
    resource: vault,
  });

  const keys = [
    {
      pubkey: toPublicKey(acceptPayment),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(bidderPotToken),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: bidderPotKey ? toPublicKey(bidderPotKey) : emptyKey,
      isSigner: false,
      isWritable: true,
    },

    {
      pubkey: toPublicKey(auctionManagerKey),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(auctionKey),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(bidder),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: tokenMint ? toPublicKey(tokenMint) : emptyKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(vault),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(store),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(PROGRAM_IDS.auction),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: PROGRAM_IDS.token,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: auctionExtendedKey ? toPublicKey(auctionExtendedKey) : emptyKey,
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
