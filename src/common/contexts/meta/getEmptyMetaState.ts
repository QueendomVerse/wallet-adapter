import { MetaState } from "./types";

export const getEmptyMetaState = (): MetaState => ({
  metadata: [],
  metadataByMetadata: {},
  metadataByMint: {},
  metadataByAuction: {},
  masterEditions: {},
  masterEditionsByPrintingMint: {},
  masterEditionsByOneTimeAuthMint: {},
  metadataByMasterEdition: {},
  editions: {},
  auctionManagersByAuction: {},
  bidRedemptions: {},
  auctions: {},
  auctionDataExtended: {},
  vaults: {},
  payoutTickets: {},
  store: null,
  allowedCreatorsByCreator: {},
  bidderMetadataByAuctionAndBidder: {},
  bidderPotsByAuctionAndBidder: {},
  safetyDepositBoxesByVaultAndIndex: {},
  prizeTrackingTickets: {},
  safetyDepositConfigsByAuctionManagerAndIndex: {},
  bidRedemptionV2sByAuctionManagerAndWinningIndex: {},
  auctionCaches: {},
  storeIndexer: [],
  packs: {},
  vouchers: {},
  auctionCachesByAuctionManager: {},
});
