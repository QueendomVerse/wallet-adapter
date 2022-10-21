import {
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import { serialize } from "borsh";

import {
  getAuctionKeys,
  getBidderKeys,
  getSafetyDepositConfig,
  ProxyCallAddress,
  RedeemBidArgs,
  RedeemUnusedWinningConfigItemsAsAuctioneerArgs,
  SCHEMA,
} from ".";
import { emptyKey } from "../../constants";
import { VAULT_PREFIX, getAuctionExtended } from "../../actions";
import {
  findProgramAddress,
  programIds,
  StringPublicKey,
  toPublicKey,
} from "../../utils";

export async function redeemBid(
  vault: StringPublicKey,
  safetyDepositTokenStore: StringPublicKey,
  destination: StringPublicKey,
  safetyDeposit: StringPublicKey,
  fractionMint: StringPublicKey,
  bidder: StringPublicKey,
  payer: StringPublicKey,
  masterEdition: StringPublicKey | undefined,
  reservationList: StringPublicKey | undefined,
  isPrintingType: boolean,
  instructions: TransactionInstruction[],
  // If this is an auctioneer trying to reclaim a specific winning index, pass it here,
  // and this will instead call the proxy route instead of the real one, wrapping the original
  // redemption call in an override call that forces the winning index if the auctioneer is authorized.
  auctioneerReclaimIndex?: number
) {
  const PROGRAM_IDS = programIds();
  const store = PROGRAM_IDS.store;
  if (!store) {
    throw new Error("Store not initialized");
  }

  // const { auctionKey, auctionManagerKey } = await getAuctionKeys(vault);
  const auctionKeys = await getAuctionKeys(vault);
  if (!auctionKeys) return;
  const { auctionKey, auctionManagerKey } = auctionKeys;

  const bidderKeys = await getBidderKeys(auctionKey, bidder);
  if (!bidderKeys) return;
  const { bidRedemption, bidMetadata } = bidderKeys;

  const transferAuthorityResult = await findProgramAddress(
    [
      Buffer.from(VAULT_PREFIX),
      toPublicKey(PROGRAM_IDS.vault).toBuffer(),
      toPublicKey(vault).toBuffer(),
    ],
    toPublicKey(PROGRAM_IDS.vault)
  );
  const transferAuthority: StringPublicKey =
    transferAuthorityResult && transferAuthorityResult.length > 0
      ? transferAuthorityResult[0]
      : "";

  const safetyDepositConfig = await getSafetyDepositConfig(
    auctionManagerKey,
    safetyDeposit
  );

  const auctionExtended = await getAuctionExtended({
    auctionProgramId: PROGRAM_IDS.auction,
    resource: vault,
  });

  const value =
    auctioneerReclaimIndex !== undefined
      ? new RedeemUnusedWinningConfigItemsAsAuctioneerArgs({
          winningConfigItemIndex: auctioneerReclaimIndex,
          proxyCall: ProxyCallAddress.RedeemBid,
        })
      : new RedeemBidArgs();
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
      pubkey: bidRedemption ? toPublicKey(bidRedemption) : emptyKey,
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
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: safetyDepositConfig ? toPublicKey(safetyDepositConfig) : emptyKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: auctionExtended ? toPublicKey(auctionExtended) : emptyKey,
      isSigner: false,
      isWritable: false,
    },
  ];

  if (isPrintingType && masterEdition && reservationList) {
    keys.push({
      pubkey: toPublicKey(masterEdition),
      isSigner: false,
      isWritable: true,
    });
    keys.push({
      pubkey: toPublicKey(reservationList),
      isSigner: false,
      isWritable: true,
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
