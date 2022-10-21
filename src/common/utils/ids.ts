import { PublicKey, AccountInfo } from "@solana/web3.js";

// import { WalletPublicKeyError } from '../../contexts';

export type StringPublicKey = string;

export class LazyAccountInfoProxy<T> {
  executable: boolean = false;
  owner: StringPublicKey = "";
  lamports: number = 0;

  get data() {
    //
    return undefined as unknown as T;
  }
}

export interface LazyAccountInfo {
  executable: boolean;
  owner: StringPublicKey;
  lamports: number;
  data: [string, string];
}

const PubKeysInternedMap = new Map<string, PublicKey>();

export const toPublicKey = (key: string | PublicKey | undefined) => {
  if (!key) {
    throw new Error("Parameter key cannot be empty!");
  }

  if (typeof key !== "string") {
    return key;
  }

  let result = PubKeysInternedMap.get(key);
  if (!result) {
    result = new PublicKey(key);
    PubKeysInternedMap.set(key, result);
  }

  return result;
};

export const pubkeyToString = (key: PublicKey | null | string = "") => {
  return typeof key === "string" ? key : key?.toBase58() || "";
};

export interface PublicKeyStringAndAccount<T> {
  pubkey: string;
  account: AccountInfo<T>;
}

export const WRAPPED_SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);

export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

export const BPF_UPGRADE_LOADER_ID = new PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111"
);

export const MEMO_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

// mpl_token_metadata
export const METADATA_PROGRAM_ID =
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s" as StringPublicKey;
// '3N3ktxGtFjh6Z461bSzCiwnmFqrEufpHLhLrotCR1pwc' as StringPublicKey; //v1.2.5
// 'GyE57W4C27yDZqXh2Wd5a1sVKwd4EQehscKWsUsFwWF6' as StringPublicKey; //v1.2.10
// '3GexdJRnKYQynrj5V76g9qLNGX6NS2KsW9G3NFZ6xfmc' as StringPublicKey; //v1.3.0
// 'J6JtY2jNyaCPC7TgFLrUXdGJiQekxMZaANnDqnMUPvqm' as StringPublicKey; //v1.3.1
// 'JE8gnRYKTGqTfjrzETBKikvq1Pu6dGGBrw3B6vFjRdn9' as StringPublicKey; //v1.3.2
// 'BNLDpR5Jp6XMfhx3SuZZmvaw8CxNmfQz8GuGc4zXn4X2' as StringPublicKey; //v1.3.3
// '5KtFXqusTedTw13qjxBGa6giHCvaj3w21UpyzamSys8C' as StringPublicKey; //v1.3.4

// mpl_token_vault.so
export const VAULT_ID =
  "vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn" as StringPublicKey;
// 'DYmabyUEmNwuCyg4weYf3MrynKhRExzbwUFMWk4gbL6S' as StringPublicKey; // match for mpl_token_metadata v1.3.1
// '6dPir6LV8HfBR5C8xRhdx2WMjw7TFRYVjFfkbncrks6c' as StringPublicKey;

//mpl_auction.so
export const AUCTION_ID =
  "auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8" as StringPublicKey;
// '3igdHPRKSc3iwAtQSLDba4xpNF4BRf6Pap4pEXKzxgEa' as StringPublicKey; // match for mpl_token_metadata v1.3.1
// '2ZvFpUwsmdGdYRsUbZS2SFKpd2kzhAg8SpM9PEWGjk7E' as StringPublicKey;

// mpl_metaplex.so
export const METAPLEX_ID =
  "p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98" as StringPublicKey;
// 'H7iQ3wd2DCGU5Ud1VgQayLy8rmaf3gia3CPd88vxpjch' as StringPublicKey;
// '4ws5K8YhzzDUJSrbU9faGpH89oMTznnKopgtXGbr6yst' as StringPublicKey; // match for mpl_token_metadata v1.3.1

export const PACK_CREATE_ID = new PublicKey(
  "packFeFNZzMfD9aVWL7QbGz1WcU7R9zpf6pvNsw2BLu"
  // '271UAmuwXa6q8XX7kHGQJ5F4p4rDifSR9tPgZQR8KNc4' // match for mpl_token_metadata v1.3.1
);

export const ORACLE_ID = new PublicKey(
  "rndshKFf48HhGaPbaCd3WQYtgCNKzRgVQ3U2we4Cvf9"
);

export const SYSTEM = new PublicKey("11111111111111111111111111111111");
