import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useBetween } from "use-between";
import { AccountInfo, PublicKey, Connection } from "@solana/web3.js";
import { AccountLayout, MintInfo, u64 } from "@solana/spl-token";

import { useConnection, ChainTickers, asyncEnsureRpcConnection } from "../..";
import { useWallet } from "../../contexts/connection/networks/solana";

import { TokenAccount } from "../../models";
import { StringPublicKey, WRAPPED_SOL_MINT } from "../../utils/ids";
import { programIds } from "../../utils/programIds";
import { genericCache, cache } from "./cache";
import { deserializeAccount } from "./deserialize";
import { TokenAccountParser, MintParser } from "./parsesrs";
import { useShareableSelectedTickerState } from "../../contexts/sharedStates";
import { getChainProp } from "../../utils";

const AccountsContext = React.createContext<any>(null);

export const useAccountsContext = () => {
  const context = useContext(AccountsContext);

  return context;
};

function wrapNativeAccount(
  pubkey: StringPublicKey,
  account?: AccountInfo<Buffer>
): TokenAccount | undefined {
  if (!account) {
    return undefined;
  }

  const key = new PublicKey(pubkey);

  return {
    pubkey: pubkey,
    account,
    info: {
      address: key,
      mint: WRAPPED_SOL_MINT,
      owner: key,
      amount: new u64(account.lamports),
      delegate: null,
      delegatedAmount: new u64(0),
      isInitialized: true,
      isFrozen: false,
      isNative: true,
      rentExemptReserve: null,
      closeAuthority: null,
    },
  };
}

const UseNativeAccount = (ticker: string = ChainTickers.SOL) => {
  const connection = useConnection(ticker);
  const { publicKey } = useWallet();

  const [nativeAccount, setNativeAccount] = useState<AccountInfo<Buffer>>();

  const updateCache = useCallback(
    (account) => {
      if (publicKey) {
        const wrapped = wrapNativeAccount(publicKey.toBase58(), account);
        if (wrapped !== undefined) {
          const id = publicKey.toBase58();
          cache.registerParser(id, TokenAccountParser);
          genericCache.set(id, wrapped as TokenAccount);
          cache.emitter.raiseCacheUpdated(id, false, TokenAccountParser, true);
        }
      }
    },
    [publicKey]
  );

  useEffect(() => {
    let subId = 0;
    const updateAccount = (account: AccountInfo<Buffer> | null) => {
      if (account) {
        updateCache(account);
        setNativeAccount(account);
      }
    };

    (async () => {
      if (!connection || !publicKey) {
        return;
      }

      let account: AccountInfo<Buffer> | null = null;
      try {
        account = await (
          await asyncEnsureRpcConnection(connection)
        ).getAccountInfo(publicKey);
      } catch (e) {
        console.error(`Connection Error: ${e}`);
      }

      updateAccount(account);

      subId = connection.onAccountChange(publicKey, updateAccount);
      if (subId) {
        await (
          await asyncEnsureRpcConnection(connection)
        ).removeAccountChangeListener(subId);
      }
    })();
  }, [setNativeAccount, publicKey, connection, updateCache]);

  // return () => {
  //   if (subId) {
  //     connection.removeAccountChangeListener(subId);
  //   }
  // };

  return { nativeAccount };
};

const PRECACHED_OWNERS = new Set<string>();
const precacheUserTokenAccounts = async (
  connection: Connection,
  owner?: PublicKey
) => {
  if (!owner) {
    return;
  }

  // used for filtering account updates over websocket
  PRECACHED_OWNERS.add(owner.toBase58());

  // user accounts are updated via ws subscription
  // console.debug('precacheUserTokenAccounts: connection')
  // console.dir(connection)
  const accounts = await (
    await asyncEnsureRpcConnection(connection)
  ).getTokenAccountsByOwner(owner, {
    programId: programIds().token,
  });

  // console.debug('precacheUserTokenAccounts: accounts')
  // console.dir(accounts)
  // console.dir(accounts.value)

  accounts.value.forEach((info) => {
    cache.add(info.pubkey.toBase58(), info.account, TokenAccountParser);
  });
};

export function AccountsProvider({ children = null }: { children: ReactNode }) {
  const { selectedTicker } = useBetween(useShareableSelectedTickerState);

  const connection = useConnection(selectedTicker);
  const { publicKey } = useWallet();
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
  const [userAccounts, setUserAccounts] = useState<TokenAccount[]>([]);
  const { nativeAccount } = UseNativeAccount(selectedTicker);
  const walletKey = publicKey?.toBase58();

  const selectUserAccounts = useCallback(() => {
    return cache
      .byParser(TokenAccountParser)
      .map((id) => cache.get(id))
      .filter((a) => a && a.info.owner.toBase58() === walletKey)
      .map((a) => a as TokenAccount);
  }, [walletKey]);

  useEffect(() => {
    const accounts = selectUserAccounts().filter(
      (a) => a !== undefined
    ) as TokenAccount[];
    setUserAccounts(accounts);
  }, [nativeAccount, tokenAccounts, selectUserAccounts]);

  useEffect(() => {
    const subs: number[] = [];
    cache.emitter.onCache((args) => {
      if (args.isNew && args.isActive) {
        const { id, parser } = args;
        connection.onAccountChange(new PublicKey(id), (info) => {
          cache.add(id, info, parser);
        });
      }
    });

    return () => {
      subs.forEach((id) => connection.removeAccountChangeListener(id));
    };
  }, [connection]);

  useEffect(() => {
    const init = async () => {
      if (!connection || !publicKey) {
        setTokenAccounts([]);
      } else {
        try {
          precacheUserTokenAccounts(connection, publicKey).then(() => {
            setTokenAccounts(selectUserAccounts());
          });
        } catch (err) {
          console.error(err);
        }
        // This can return different types of accounts: token-account, mint, multisig
        // @TODO: web3.js expose ability to filter.
        // this should use only filter syntax to only get accounts that are owned by user
        const tokenSubID = connection.onProgramAccountChange(
          programIds().token,
          (info) => {
            // @TODO: fix type in web3.js
            const id = info.accountId as unknown as string;
            // @TODO: do we need a better way to identify layout (maybe a enum identifing type?)
            if (info.accountInfo.data.length === AccountLayout.span) {
              const data = deserializeAccount(info.accountInfo.data);

              if (PRECACHED_OWNERS.has(data.owner.toBase58())) {
                cache.add(id, info.accountInfo, TokenAccountParser);
                setTokenAccounts(selectUserAccounts());
              }
            }
          },
          "singleGossip"
        );
        return async () => {
          // connection.removeProgramAccountChangeListener(tokenSubID);
          await (
            await asyncEnsureRpcConnection(connection)
          ).removeProgramAccountChangeListener(tokenSubID);
        };
      }
    };
    init();
  }, [connection, publicKey, selectUserAccounts]);

  return (
    <AccountsContext.Provider
      value={{
        userAccounts,
        nativeAccount,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}

export function useNativeAccount() {
  const context = useContext(AccountsContext);
  return {
    account: context.nativeAccount as AccountInfo<Buffer>,
  };
}

export function useMint(key?: string | PublicKey, chain?: string) {
  // console.warn('func: useMint')
  const connection = chain
    ? useConnection(getChainProp(chain).ticker)
    : useConnection();
  if (!connection) {
    console.error(`Unable to establish ${chain} connection.`);
    return;
  }

  const { publicKey } = useWallet();

  const [mint, setMint] = useState<MintInfo>();

  const id =
    typeof key === "string" ? key : key?.toBase58() ?? publicKey?.toBase58();
  // console.info('useMint: id', id)

  useEffect(() => {
    // useMemo(() => {
    // const init = useCallback(() => {
    if (!connection) {
      console.error(`Unable to establish ${chain} connection.`);
      return;
    }

    // if (!id || !mint) {
    if (!id) {
      // console.error(`No mint('${mint}) or Id('${id}') found!`)
      console.error(`No Id('${id}') found!`);
      return;
    }

    // console.info('useMint: parsing ...')
    cache
      .query(connection, id, MintParser)
      .then((acc) => setMint(acc.info))
      .catch((err) => console.error(err));

    // console.info('useMint: disposing ...')
    const dispose = cache.emitter.onCache((e) => {
      const event = e;
      // console.info('useMint: dispose', event)
      if (event.id === id) {
        cache
          .query(connection, id, MintParser)
          .then((mint) => setMint(mint.info));
      }
    });
    return () => {
      dispose();
    };
    // }, [connection, id, mint]);
  }, [connection, id]);

  // init()
  // console.info('useMint: result')
  // console.dir(mint)
  return mint;
}

export function useAccount(pubKey?: PublicKey, ticker?: string) {
  const connection = ticker ? useConnection(ticker) : useConnection();
  const [account, setAccount] = useState<TokenAccount>();

  const key = pubKey?.toBase58();
  useEffect(() => {
    const query = async () => {
      try {
        if (!key) {
          return;
        }

        const acc = await cache
          .query(connection, key, TokenAccountParser)
          .catch((err) => console.error(err));
        if (acc) {
          setAccount(acc);
        }
      } catch (err) {
        console.error(err);
      }
    };

    query();

    const dispose = cache.emitter.onCache((e) => {
      const event = e;
      if (event.id === key) {
        query();
      }
    });
    return () => {
      dispose();
    };
  }, [connection, key]);

  return account;
}
