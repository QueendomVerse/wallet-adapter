import type { ReactNode } from 'react';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import type { AccountInfo } from '@solana/web3.js';
import type { MintInfo } from '@solana/spl-token';
import { AccountLayout, u64 } from '@solana/spl-token';

import type { Chain, SolanaConnection, StringPublicKey } from '@mindblox-wallet-adapter/base';
import { SolanaPublicKey } from '@mindblox-wallet-adapter/base';

import { genericCache, cache } from './cache';
import { deserializeAccount } from './deserialize';
import { TokenAccountParser, MintParser } from './parsers';
import type { TokenAccount } from '../types';
import { WRAPPED_SOL_MINT } from '../types';

import { useConnection } from '../providers';
import { useWallet } from '../hooks';
import type { ParsedAccountBase } from './types';
import { programIds } from '../utils';

type CacheEvent = {
    id: string;
};

export interface IAccountsContext {
    userAccounts: TokenAccount[];
    nativeAccount: AccountInfo<Buffer> | undefined;
}

interface NativeAccountConnection {
    nativeAccount: AccountInfo<Buffer> | undefined;
}

export interface NativeAccount {
    account: AccountInfo<Buffer>;
}

export type MintConnection = MintInfo | undefined;

export type MintAccount = TokenAccount | undefined;

export type AccountConnection = ParsedAccountBase | undefined;

export interface UserAcounts {
    userAccounts: TokenAccount[];
    accountByMint: Map<string, TokenAccount>;
}

export interface AccountsProviderProps {
    children: ReactNode;
}

const PRECACHED_OWNERS = new Set<string>();

export const AccountsContext = React.createContext<IAccountsContext | null>(null);

const precacheUserTokenAccounts = async (connection: SolanaConnection, owner?: SolanaPublicKey): Promise<void> => {
    if (!owner) {
        return;
    }

    PRECACHED_OWNERS.add(owner.toBase58());

    const accounts = await connection.getTokenAccountsByOwner(owner, {
        programId: programIds().token,
    });

    accounts.value.map((info) => cache.add(info.pubkey.toBase58(), info.account, TokenAccountParser));
};

const wrapNativeAccount = (pubkey: StringPublicKey, account?: AccountInfo<Buffer>) => {
    const key = new SolanaPublicKey(pubkey);
    return account
        ? {
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
          }
        : undefined;
};

const useNativeAccountConnection = (): NativeAccountConnection => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();

    const [nativeAccount, setNativeAccount] = useState<AccountInfo<Buffer>>();

    const updateCache = useCallback(
        (account: AccountInfo<Buffer>) => {
            const id = publicKey?.toBase58();
            const wrappedAccount = id && wrapNativeAccount(id, account);

            if (wrappedAccount) {
                cache.registerParser(id, TokenAccountParser);
                genericCache.set(id, wrappedAccount as TokenAccount);
                cache.emitter.raiseCacheUpdated(id, false, TokenAccountParser, true);
            }
        },
        [publicKey]
    );

    useEffect(() => {
        let subId: number | null = null;

        const updateAccount = (account: AccountInfo<Buffer> | null) => {
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

export const useMint = (key?: string | SolanaPublicKey, chain?: Chain): MintConnection => {
    const { connection } = useConnection();
    if (!connection) {
        console.error(`Unable to establish ${chain} connection.`);
        return;
    }

    const { publicKey } = useWallet();

    const [mint, setMint] = useState<MintInfo>();
    const id = typeof key === 'string' ? key : key?.toBase58() ?? publicKey?.toBase58();

    useEffect(() => {
        const fetchInfo = async () => {
            if (id) {
                try {
                    const acc = await cache.query(connection, id, MintParser);
                    setMint(acc.info.data);
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
    }, [connection, id]);

    return mint;
};

export const usePublicAccount = (pubKey?: SolanaPublicKey): AccountConnection => {
    const { connection } = useConnection();
    const [account, setAccount] = useState<ParsedAccountBase>();

    const key = pubKey?.toBase58();

    useEffect(() => {
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

export const AccountsProvider = ({ children = null }: AccountsProviderProps) => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
    const [userAccounts, setUserAccounts] = useState<TokenAccount[]>([]);
    const { nativeAccount } = useNativeAccountConnection();
    const walletKey = publicKey?.toBase58();

    const selectUserAccounts = useCallback(
        () =>
            cache
                .byParser(TokenAccountParser)
                .map((id) => cache.get(id))
                .filter((a: any) => a?.info?.owner?.toBase58() === walletKey)
                .map((a) => a as TokenAccount),
        [walletKey]
    );

    useEffect(() => {
        const accounts = selectUserAccounts().filter((a) => a !== undefined) as TokenAccount[];
        setUserAccounts(accounts);
    }, [nativeAccount, tokenAccounts, selectUserAccounts]);

    useEffect(() => {
        const subs: number[] = [];
        if (connection) {
            cache.emitter.onCache((args) => {
                if (args.isNew && args.isActive) {
                    const { id, parser } = args;
                    const subId = connection.onAccountChange(new SolanaPublicKey(id), (info) => {
                        cache.add(id, info, parser);
                    });
                    subs.push(subId);
                }
            });
            return () => subs.forEach((id) => connection.removeAccountChangeListener(id));
        }
    }, [connection]);

    useEffect(() => {
        if (!connection || !publicKey) {
            setTokenAccounts([]);
            return;
        } else {
            precacheUserTokenAccounts(connection, publicKey).then(() => {
                setTokenAccounts(selectUserAccounts());
            });

            let tokenSubID: number | null = null;

            tokenSubID = connection.onProgramAccountChange(
                programIds().token,
                (info) => {
                    const id = info.accountId.toString();

                    if (info.accountInfo.data.length === AccountLayout.span) {
                        const data = deserializeAccount(info.accountInfo.data);

                        if (PRECACHED_OWNERS.has(data.owner.toBase58())) {
                            cache.add(id, info.accountInfo, TokenAccountParser);
                            setTokenAccounts(selectUserAccounts());
                        }
                    }
                },
                'singleGossip'
            );

            return () => {
                if (tokenSubID && connection) {
                    connection.removeProgramAccountChangeListener(tokenSubID);
                }
            };
        }
    }, [connection, publicKey, selectUserAccounts]);

    return <AccountsContext.Provider value={{ userAccounts, nativeAccount }}>{children}</AccountsContext.Provider>;
};

export const useNativeAccount = (): NativeAccount => {
    const context = useContext(AccountsContext);
    if (!context) {
        throw new Error('Unable to establish a native account connection');
    }
    return {
        account: context.nativeAccount as AccountInfo<Buffer>,
    };
};

export const useUserAccounts = (): UserAcounts => {
    const context = useAccounts();

    const accountByMint = context.userAccounts.reduce((prev: Map<string, TokenAccount>, acc: TokenAccount) => {
        prev.set(acc.info.mint.toBase58(), acc);
        return prev;
    }, new Map<string, TokenAccount>());
    return {
        userAccounts: context.userAccounts as TokenAccount[],
        accountByMint,
    };
};

export const useAccountByMint = (mint?: string | SolanaPublicKey): MintAccount => {
    const { userAccounts } = useUserAccounts();
    const mintAddress = typeof mint === 'string' ? mint : mint?.toBase58();

    const index = userAccounts.findIndex((acc) => acc.info.mint.toBase58() === mintAddress);

    if (index !== -1) {
        return userAccounts[index];
    }

    return;
};
