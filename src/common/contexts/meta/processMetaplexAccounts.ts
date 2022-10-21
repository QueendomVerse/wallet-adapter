import { AccountInfo, PublicKey } from "@solana/web3.js";
import // BidRedemptionTicket,
// MetaplexKey,
// Store,
// WhitelistedCreator,
// PayoutTicket,
// PrizeTrackingTicket,
// SafetyDepositConfig,
"@metaplex-foundation/mpl-metaplex";

import {
  Store,
  PayoutTicket,
  BidRedemptionTicket,
  PrizeTrackingTicket,
  SafetyDepositConfig,
  WhitelistedCreator,
  AuctionManagerV1,
  AuctionManagerV2,
  decodeAuctionManager,
  decodeBidRedemptionTicket,
  MetaplexKey,
  decodeStore,
  isCreatorPartOfTheStore,
  AllowedCreatorParser,
  decodePayoutTicket,
  decodePrizeTrackingTicket,
  BidRedemptionTicketV2,
  decodeSafetyDepositConfig,
  decodeAuctionCache,
  AuctionCache,
  decodeStoreIndexer,
  StoreIndexer,
} from "../../models";
import { ProcessAccountsFunc } from "./types";
// import { METAPLEX_ID, programIds, pubkeyToString, fetchGetJSON } from '../../utils';
import { METAPLEX_ID, programIds, pubkeyToString } from "../../utils";
import { ParsedAccount } from "../accounts";
import { cache } from "../accounts";
import names from "../../config/userNames.json";

export const processMetaplexAccounts: ProcessAccountsFunc = async (
  { account, pubkey },
  setter
) => {
  if (!isMetaplexAccount(account)) return;

  try {
    const STORE_ID = programIds().store;

    if (
      isAuctionManagerV1Account(account) ||
      isAuctionManagerV2Account(account)
    ) {
      const storeKey = new PublicKey(account.data.slice(1, 33));

      if (STORE_ID && storeKey.equals(STORE_ID)) {
        const auctionManager = decodeAuctionManager(account.data);

        const parsedAccount: ParsedAccount<
          AuctionManagerV1 | AuctionManagerV2
        > = {
          pubkey,
          account,
          info: auctionManager,
        };
        setter(
          "auctionManagersByAuction",
          auctionManager.auction,
          parsedAccount
        );
      }
    }

    if (
      isBidRedemptionTicketV1Account(account) ||
      isBidRedemptionTicketV2Account(account)
    ) {
      const ticket = decodeBidRedemptionTicket(account.data);
      const parsedAccount: ParsedAccount<BidRedemptionTicket> = {
        pubkey,
        account,
        info: ticket,
      };
      setter("bidRedemptions", pubkey, parsedAccount);

      if (ticket.key == MetaplexKey.BidRedemptionTicketV2) {
        const asV2 = ticket as BidRedemptionTicketV2;
        if (asV2.winnerIndex) {
          setter(
            "bidRedemptionV2sByAuctionManagerAndWinningIndex",
            asV2.auctionManager + "-" + asV2.winnerIndex.toNumber(),
            parsedAccount
          );
        }
      }
    }

    if (isPayoutTicketV1Account(account)) {
      const ticket = decodePayoutTicket(account.data);
      const parsedAccount: ParsedAccount<PayoutTicket> = {
        pubkey,
        account,
        info: ticket,
      };
      setter("payoutTickets", pubkey, parsedAccount);
    }

    if (isAuctionCacheV1Account(account)) {
      const cache = decodeAuctionCache(account.data);
      const parsedAccount: ParsedAccount<AuctionCache> = {
        pubkey,
        account,
        info: cache,
      };

      if (parsedAccount.info.store === STORE_ID?.toBase58()) {
        setter("auctionCaches", pubkey, parsedAccount);
        setter(
          "auctionCachesByAuctionManager",
          parsedAccount.info.auctionManager,
          parsedAccount
        );
      }
    }

    if (isStoreIndexerV1Account(account)) {
      const indexer = decodeStoreIndexer(account.data);
      const parsedAccount: ParsedAccount<StoreIndexer> = {
        pubkey,
        account,
        info: indexer,
      };
      if (parsedAccount.info.store == STORE_ID?.toBase58()) {
        setter("storeIndexer", pubkey, parsedAccount);
      }
    }

    if (isPrizeTrackingTicketV1Account(account)) {
      const ticket = decodePrizeTrackingTicket(account.data);
      const parsedAccount: ParsedAccount<PrizeTrackingTicket> = {
        pubkey,
        account,
        info: ticket,
      };
      setter("prizeTrackingTickets", pubkey, parsedAccount);
    }

    if (isStoreV1Account(account)) {
      const store = decodeStore(account.data);
      const parsedAccount: ParsedAccount<Store> = {
        pubkey,
        account,
        info: store,
      };
      if (STORE_ID && pubkey === STORE_ID.toBase58()) {
        setter("store", pubkey, parsedAccount);
      }
    }

    if (isSafetyDepositConfigV1Account(account)) {
      const config = decodeSafetyDepositConfig(account.data);
      const parsedAccount: ParsedAccount<SafetyDepositConfig> = {
        pubkey,
        account,
        info: config,
      };
      setter(
        "safetyDepositConfigsByAuctionManagerAndIndex",
        config.auctionManager + "-" + config.order.toNumber(),
        parsedAccount
      );
    }

    if (isAllowedCreatorV1Account(account)) {
      const parsedAccount = cache.add(
        pubkey,
        account,
        AllowedCreatorParser,
        false
      ) as ParsedAccount<WhitelistedCreator>;

      // TODO: figure out a way to avoid generating creator addresses during parsing
      // should we store store id inside creator?
      if (STORE_ID) {
        const isAllowedCreator = await isCreatorPartOfTheStore(
          parsedAccount.info.address,
          pubkey
        );
        // call the api
        /* TODO: use env. variable for different environments */
        // const users = await fetchGetJSON('http://localhost:9090/d/users');
        //  modify  data same as in userNames.json file
        // let names: any = {};
        // for (let user of users) {
        //   names[user.walletAddress] = {...user}
        // }

        const nameInfo = (names as any)[parsedAccount.info.address];

        if (nameInfo) {
          parsedAccount.info = { ...parsedAccount.info, ...nameInfo };
        }
        if (isAllowedCreator) {
          setter(
            "allowedCreatorsByCreator",
            parsedAccount.info.address,
            parsedAccount
          );
        }
      }
    }
  } catch {
    // ignore errors (why!?)
    // add type as first byte for easier deserialization
  }
};

const isMetaplexAccount = (account: AccountInfo<Buffer>) =>
  pubkeyToString(account?.owner) === METAPLEX_ID;

const isAuctionManagerV1Account = (account: AccountInfo<Buffer>) =>
  account.data[0] === MetaplexKey.AuctionManagerV1;

const isAuctionManagerV2Account = (account: AccountInfo<Buffer>) =>
  account.data[0] === MetaplexKey.AuctionManagerV2;

const isBidRedemptionTicketV1Account = (account: AccountInfo<Buffer>) =>
  account.data[0] === MetaplexKey.BidRedemptionTicketV1;

const isBidRedemptionTicketV2Account = (account: AccountInfo<Buffer>) =>
  account.data[0] === MetaplexKey.BidRedemptionTicketV2;

const isPayoutTicketV1Account = (account: AccountInfo<Buffer>) =>
  account.data[0] === MetaplexKey.PayoutTicketV1;

const isPrizeTrackingTicketV1Account = (account: AccountInfo<Buffer>) =>
  account.data[0] === MetaplexKey.PrizeTrackingTicketV1;

const isStoreV1Account = (account: AccountInfo<Buffer>) =>
  account.data[0] === MetaplexKey.StoreV1;

const isSafetyDepositConfigV1Account = (account: AccountInfo<Buffer>) =>
  account.data[0] === MetaplexKey.SafetyDepositConfigV1;

const isAllowedCreatorV1Account = (account: AccountInfo<Buffer>) =>
  account.data[0] === MetaplexKey.AllowedCreatorV1;

const isAuctionCacheV1Account = (account: AccountInfo<Buffer>) =>
  account.data[0] === MetaplexKey.AuctionCacheV1;

const isStoreIndexerV1Account = (account: AccountInfo<Buffer>) =>
  account.data[0] === MetaplexKey.StoreIndexerV1;
