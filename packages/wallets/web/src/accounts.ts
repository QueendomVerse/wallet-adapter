import React, { useCallback, useContext, useEffect, useState } from 'react';

// import { RawSolanaTokenAccount, Numberu64
// } from '@mindblox-wallet-adapter/solana';
import type {
    ParsedAccountBase, SolanaAccountInfo
} from '@mindblox-wallet-adapter/solana';
import type {
    MintAccount, Mint
} from '@mindblox-wallet-adapter/networks';
import {
    SolanaTokenAccountState, useMint as useSolanaMint, useMintAccount as useSolanaMintAccount
} from '@mindblox-wallet-adapter/solana';
import {
    emptyKey,
    cache,
    // deserializeAccount,
    genericCache,
    // MintParser,
    programIds,
    // SolanaAccountLayout,
    TokenAccountParser,
    WRAPPED_SOL_MINT,
    // unpackSolanaTokenAccount,
    // createWrappedNativeSolanaAccount,
    // u64,
    SolanaPublicKey,
} from '@mindblox-wallet-adapter/solana';
// import {
//     SolanaTokenAccount, useSolanaConnection, useSolanaWallet
// } from '@mindblox-wallet-adapter/networks';

import type {
    ChainPublicKey,
    ChainConnectionMap,
    StringPublicKey,
    ChainTicker,
    SolanaConnection,
    ChainPublicKeyMap,
    Chain,
} from '@mindblox-wallet-adapter/base';
import { ChainTickers } from '@mindblox-wallet-adapter/base';

import { useWallet, useWalletAdapterConfig } from './hooks';
import type{ SolanaTokenAccount } from '@mindblox-wallet-adapter/networks';
import { useSolanaConnection, useSolanaWallet , ChainConnectionFactory} from '@mindblox-wallet-adapter/networks';

type CacheEvent = {
    id: string;
};

interface IAccountsContext {
    userAccounts: SolanaTokenAccount[];
    nativeAccount: SolanaAccountInfo<Buffer> | undefined;
}

interface NativeAccountConnection {
    nativeAccount: SolanaAccountInfo<Buffer> | undefined;
}

interface NativeAccount {
    account: SolanaAccountInfo<Buffer>;
}

type WrappedNativeAccount = SolanaTokenAccount | undefined;

type PublicAccount = ParsedAccountBase | undefined;

// interface AccountsProviderProps {
//     children: ReactNode;
// }

const PRECACHED_OWNERS = new Set<string>();

const AccountsContext = React.createContext<IAccountsContext | null>(null);

const precacheUserTokenAccounts = async <CT extends ChainTicker>(
    chain: CT,
    connection: ChainConnectionMap[CT],
    owner?: ChainPublicKeyMap[CT]
): Promise<void> => {
    if (!owner) {
        return;
    }

    PRECACHED_OWNERS.add(owner.toBase58());

    switch (chain) {
        case ChainTickers.SOL: {
            const solanaConnection = connection as SolanaConnection;
            const solanaOwner = owner as SolanaPublicKey;
            const accounts = await solanaConnection.getTokenAccountsByOwner(solanaOwner, {
                programId: programIds().token,
            });
            accounts.value.map((info) => cache.add(info.pubkey.toBase58(), info.account, TokenAccountParser));
            break;
        }
        case ChainTickers.NEAR: {
            throw new Error('Precaching User token accounts not yet implimented on Near!');
        }
        default:
            throw new Error(`Unable to precache user token: Invalid chain ${chain}`);
    }
};

const wrapNativeAccount = <CT extends ChainTicker>(
    chain: CT,
    pubkey: StringPublicKey,
    account?: SolanaAccountInfo<Buffer>
): WrappedNativeAccount => {
    switch (chain) {
        case ChainTickers.SOL: {
            const key = new SolanaPublicKey(pubkey);
            return account
                ? {
                      pubkey: pubkey,
                      account,
                    //   info: createWrappedNativeSolanaAccount(key, )
                      info: {
                        //   address: key,
                          mint: WRAPPED_SOL_MINT,
                          owner: key,
                          amount: BigInt(account.lamports),
                          delegate: emptyKey,
                          delegatedAmount: BigInt(0),
                        //   isInitialized: true,
                        //   isFrozen: false,
                          isNative: BigInt(1),
                        //   rentExemptReserve: null,
                        delegateOption: 0,
                        state: SolanaTokenAccountState.Initialized,
                        isNativeOption: 0,
                        closeAuthorityOption: 0,
                          closeAuthority: emptyKey,
                      },
                  }
                : undefined;
        }
        case ChainTickers.NEAR: {
            throw new Error('Wrapping native account not yet implimented on Near!');
        }
        default:
            throw new Error(`Unable to wrap native account: Invalid chain ${chain}`);
    }
};

const useNativeAccountConnection = (chain: ChainTicker = ChainTickers.SOL): NativeAccountConnection | undefined => {
    if (chain !== ChainTickers.SOL) {
        console.error(`Unable to use public account for ${chain} chain`);
        return;
    }
    // const { connection } = useSolanaConnection();
    const { adapterConfig } = useWalletAdapterConfig()
    const connection = ChainConnectionFactory.createConnection<SolanaConnection>(
    adapterConfig.chain, adapterConfig.network);
    // const { publicKey } = useWallet();
    const { publicKey } = useSolanaWallet();
    // const _solPubKey = publicKey && new SolanaPublicKey(publicKey.toBase58())

    const [nativeAccount, setNativeAccount] = useState<SolanaAccountInfo<Buffer>>();

    const updateCache = useCallback(
        (account: SolanaAccountInfo<Buffer>) => {
            const id = publicKey?.toBase58();
            const wrappedAccount = id && wrapNativeAccount(chain, id, account);

            if (wrappedAccount) {
                cache.registerParser(id, TokenAccountParser);
                genericCache.set(id, wrappedAccount as SolanaTokenAccount);
                cache.emitter.raiseCacheUpdated(id, false, TokenAccountParser, true);
            }
        },
        [publicKey]
    );

    useEffect(() => {
        let subId: number | null = null;

        const updateAccount = (account: SolanaAccountInfo<Buffer> | null) => {
            if (account) {
                updateCache(account);
                setNativeAccount(account);
            }
        };

        (async () => {
            const account = connection && publicKey && (await connection.getAccountInfo(publicKey));

            if (account) {
                updateAccount(account);
                subId = connection?.onAccountChange(publicKey, updateAccount) || null;
            }
        })();

        return () => {
            if (subId && connection) {
                connection.removeAccountChangeListener(subId);
            }
        };
    }, [setNativeAccount, publicKey, connection, updateCache]);

    return { nativeAccount };
};

export const useAccounts = () => {
    const context = useContext(AccountsContext);
    if (!context) {
        throw new Error('Unable to find accounts');
    }
    return context;
};

export const useMintAccount = (key?: string | ChainPublicKey, chain?: Chain): MintAccount | undefined => {
    // const { connection } = useConnection();
    // const { connection } = useSolanaConnection();
    // if (!connection) {
    //     console.error(`Unable to establish ${chain} connection.`);
    //     return;
    // }

    const { publicKey } = useWallet();
    const solanaMint = useSolanaMintAccount(key, chain)
    // const { publicKey } = useSolanaWallet();

    const [mint, setMint] = useState<MintAccount | undefined>();
    const id = typeof key === 'string' ? key : key?.toBase58() ?? publicKey?.toBase58();

    useEffect(() => {
        const fetchInfo = async () => {
            if (solanaMint) {
                try {
                    // const acc = await cache.query(connection, id, MintParser);
                    // setMint(acc.info.data);
                    setMint(solanaMint)
                } catch (err) {
                    console.error(err);
                }
            }
        };

        const updateCache = (e: CacheEvent) => {
            if (e.id === id) fetchInfo();
        };

        fetchInfo();

        const dispose = cache.emitter.onCache(updateCache);

        return () => {
            dispose();
        };
    }, [solanaMint]);

    return mint;
};

export const useMint = (key?: string | ChainPublicKey, chain?: Chain): Mint | undefined => {
    const { publicKey } = useWallet();
    const solanaMint = useSolanaMint(key, chain)

    const [mint, setMint] = useState<Mint | undefined>();
    const id = typeof key === 'string' ? key : key?.toBase58() ?? publicKey?.toBase58();

    useEffect(() => {
        const fetchInfo = async () => {
            if (solanaMint) {
                try {
                    // const acc = await cache.query(connection, id, MintParser);
                    // setMint(acc.info.data);
                    setMint(solanaMint)
                } catch (err) {
                    console.error(err);
                }
            }
        };

        const updateCache = (e: CacheEvent) => {
            if (e.id === id) fetchInfo();
        };

        fetchInfo();

        const dispose = cache.emitter.onCache(updateCache);

        return () => {
            dispose();
        };
    }, [solanaMint]);

    return mint;
};

export const usePublicAccount = (pubKey?: ChainPublicKey, chain?: ChainTicker): PublicAccount => {
    if (chain !== ChainTickers.SOL) {
        console.error(`Unable to use public account for ${chain} chain`);
        return;
    }
    // const { connection } = useConnection(chain);
    const { connection } = useSolanaConnection();
    const [account, setAccount] = useState<ParsedAccountBase>();

    const key = pubKey?.toBase58();

    useEffect(() => {
        if (!connection) return;
        const query = async () => {
            if (!key) return;

            try {
                const acc = await cache.query(connection, key, TokenAccountParser).catch(console.error);

                acc && setAccount(acc);
            } catch (err) {
                console.error(err);
            }
        };

        query();

        const dispose = cache.emitter.onCache((e: CacheEvent) => e.id === key && query());

        return () => {
            dispose();
        };
    }, [connection, key]);

    return account;
};

// export const AccountsProvider = ({ children = null }: AccountsProviderProps) => {
//     // const connection = useConnection();
//     // const { publicKey } = useWallet();
//     const connection = useSolanaConnection();
//     const { publicKey } = useSolanaWallet();
//     const [tokenAccounts, setTokenAccounts] = useState<SolanaTokenAccount[]>([]);
//     const [userAccounts, setUserAccounts] = useState<SolanaTokenAccount[]>([]);
//     const { nativeAccount } = useNativeAccountConnection();
//     const walletKey = publicKey?.toBase58();

//     const selectUserAccounts = useCallback(
//         () =>
//             cache
//                 .byParser(TokenAccountParser)
//                 .map((id) => cache.get(id))
//                 .filter((a: any) => a?.info?.owner?.toBase58() === walletKey)
//                 .map((a) => a as SolanaTokenAccount),
//         [walletKey]
//     );

//     useEffect(() => {
//         const accounts = selectUserAccounts().filter((a) => a !== undefined) as SolanaTokenAccount[];
//         setUserAccounts(accounts);
//     }, [nativeAccount, tokenAccounts, selectUserAccounts]);

//     useEffect(() => {
//         const subs: number[] = [];
//         if (connection) {
//             cache.emitter.onCache((args) => {
//                 if (args.isNew && args.isActive) {
//                     const { id, parser } = args;
//                     const subId = connection.onAccountChange(new ChainPublicKey(id), (info) => {
//                         cache.add(id, info, parser);
//                     });
//                     subs.push(subId);
//                 }
//             });
//             return () => subs.forEach((id) => connection.removeAccountChangeListener(id));
//         }
//     }, [connection]);

//     useEffect(() => {
//         if (!connection || !publicKey) {
//             setTokenAccounts([]);
//             return;
//         } else {
//             precacheUserTokenAccounts(connection, publicKey).then(() => {
//                 setTokenAccounts(selectUserAccounts());
//             });

//             let tokenSubID: number | null = null;

//             tokenSubID = connection.onProgramAccountChange(
//                 programIds().token,
//                 (info) => {
//                     const id = info.accountId.toString();

//                     if (info.accountInfo.data.length === SolanaAccountLayout.span) {
//                         const data = deserializeAccount(info.accountInfo.data);

//                         if (PRECACHED_OWNERS.has(data.owner.toBase58())) {
//                             cache.add(id, info.accountInfo, TokenAccountParser);
//                             setTokenAccounts(selectUserAccounts());
//                         }
//                     }
//                 },
//                 'singleGossip'
//             );

//             return () => {
//                 if (tokenSubID && connection) {
//                     connection.removeProgramAccountChangeListener(tokenSubID);
//                 }
//             };
//         }
//     }, [connection, publicKey, selectUserAccounts]);

//     return <AccountsContext.Provider value={{ userAccounts, nativeAccount }}>{children}</AccountsContext.Provider>;
// };

export const useNativeAccount = (): NativeAccount => {
    const context = useContext(AccountsContext);
    if (!context) {
        throw new Error('Unable to establish a native account connection');
    }
    return {
        account: context.nativeAccount as SolanaAccountInfo<Buffer>,
    };
};

export const useUserAccounts = (): {
    userAccounts: SolanaTokenAccount[];
    accountByMint: Map<string, SolanaTokenAccount>;
} => {
    const context = useAccounts();

    const accountByMint = context.userAccounts.reduce(
        (prev: Map<string, SolanaTokenAccount>, acc: SolanaTokenAccount) => {
            prev.set(acc.info.mint.toBase58(), acc);
            return prev;
        },
        new Map<string, SolanaTokenAccount>()
    );
    return {
        userAccounts: context.userAccounts as SolanaTokenAccount[],
        accountByMint,
    };
};

export const useAccountByMint = (mint?: string | ChainPublicKey) => {
    const { userAccounts } = useUserAccounts();
    const mintAddress = typeof mint === 'string' ? mint : mint?.toBase58();

    const index = userAccounts.findIndex((acc) => acc.info.mint.toBase58() === mintAddress);

    if (index !== -1) {
        return userAccounts[index];
    }

    return;
};
