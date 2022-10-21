// import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
// import { Store, WhitelistedCreator } from '@metaplex-foundation/mpl-metaplex';
import { Metadata } from "../../actions";
import { Store, WhitelistedCreator } from "../../models/metaplex";

import { ParsedAccount } from "../accounts/types";

export const isMetadataPartOfStore = (
  m: ParsedAccount<Metadata>,
  allowedCreatorsByCreator: Record<string, ParsedAccount<WhitelistedCreator>>,
  store?: ParsedAccount<Store> | null
) => {
  if (!m?.info?.data?.creators) {
    return false;
  }

  return m?.info.data.creators.some(
    (c) =>
      c.verified &&
      (store?.info.public ||
        allowedCreatorsByCreator[c.address]?.info?.activated)
  );
  // return m?.info.data.creators.some(
  //   c =>
  //     c.verified &&
  //     (store?.info.pubkey.toBase58() ||
  //       allowedCreatorsByCreator[c.address.toBase58()]?.info?.data.activated),
  // );
};
