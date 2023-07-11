import type { FC, ReactNode } from 'react';
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useBetween } from 'use-between';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
// import { ParsedUrlQuery } from 'querystring';
import { useShareableWalletConnectedState } from '@mindblox-wallet-adapter/react';
import type { QueryParams } from '../../../utils';

// import { useLocation } from 'react-router-dom';

// export const useQuerySearch = () => {
//   return new URLSearchParams(useLocation().search);
// }

// interface QueryParams extends ParsedUrlQuery {
//   account_id: string;
//   public_key: string;
//   all_keys: string[];
//   transactionHashes: string[];
// }

interface Props {
    children: ReactNode;
}

interface BrowserWalletContextState {
    accountId: string;
    setAccountId: (accountId: string) => void;
    publicKey: string;
    setPublicKey: (publicKey: string) => void;
    allKeys: string[];
    setAllKeys: (allKeys: string[]) => void;
}

const DEFAULT_CONTEXT_STATE: BrowserWalletContextState = {
    accountId: '',
    setAccountId: (accountId: string) => {
        console.debug(`setAccountId was called with: ${accountId}`);
    },
    publicKey: '',
    setPublicKey: (publicKey: string) => {
        console.debug(`setPublicKey was called with: ${publicKey}`);
    },
    allKeys: [''],
    setAllKeys: (allKeys: string[]) => {
        console.debug(`setAllKeys was called with: ${allKeys}`);
    },
};

const BrowserWalletContext = createContext<BrowserWalletContextState>(DEFAULT_CONTEXT_STATE);

export const BrowserWalletProvider: FC<Props> = ({ children }) => {
    console.warn('func: BrowserWalletProvider');
    const { isWalletConnected } = useBetween(useShareableWalletConnectedState);

    const [loading, setLoading] = useState(false);

    // get the search params
    const useQuerySearch = () => {
        return new URLSearchParams(useLocation().search);
    };

    const navigate = useNavigate();
    const searchParams = useQuerySearch();

    const routerQuery = Array.from(searchParams.entries()).reduce(
        (acc, [key, value]) => ({
            ...acc,
            [key]: value,
        }),
        {}
    ) as QueryParams;

    // console.debug('BrowserWalletProvider: search account_id', searchParams.get('account_id'));
    // console.debug('BrowserWalletProvider: search public_key', searchParams.get('public_key'));
    // console.debug('BrowserWalletProvider: search all_keys', searchParams.get('all_keys'));

    const [accountId, setAccountId] = useState<string>(routerQuery.account_id ?? searchParams.get('account_id'));
    const [publicKey, setPublicKey] = useState<string>(routerQuery.public_key ?? searchParams.get('public_key'));
    const [allKeys, setAllKeys] = useState<string[]>(routerQuery.all_keys ?? searchParams.get('all_keys'));

    const [transactionHashes, setTransactionHashes] = useState<string[]>(
        routerQuery.transactionHashes ?? searchParams.get('transactionHashes')
    );

    const contextValue = useMemo(() => {
        setLoading(true);

        const state = {
            accountId,
            setAccountId,
            publicKey,
            setPublicKey,
            allKeys,
            setAllKeys,
            transactionHashes,
            setTransactionHashes,
        };

        setLoading(false);
        return state;
    }, [accountId, publicKey, allKeys, transactionHashes]);

    useEffect(() => {
        if (!isWalletConnected && accountId && publicKey && allKeys) {
            const getPrevPath = () => {
                const redirectUrl = new URL(document.URL);
                const prevHash = redirectUrl.hash.split('#');
                if (prevHash.length < 2) return '';

                return prevHash[1] ?? redirectUrl.pathname;
            };
            const prevPath = getPrevPath();
            const toPage = new URL(`/%23${prevPath}`, window.location.origin);
            const toPageString = toPage.href.replace(/%23/g, '#'); // for HashRouter
            console.info(`To page URL with parameters 2: ${toPageString}`);

            // navigate('/signin');
            // navigate(-2)
            // navigate('/signup');
            console.warn('redirecting back ... 2');
            navigate(toPageString);
        }
    }, [isWalletConnected, accountId, publicKey, allKeys]);

    useEffect(() => {
        if (isWalletConnected && transactionHashes) {
            const getPrevPath = () => {
                const redirectUrl = new URL(document.URL);
                const prevHash = redirectUrl.hash.split('#');
                if (prevHash.length < 2) return '';

                return prevHash[1] ?? redirectUrl.pathname;
            };
            const prevPath = getPrevPath();
            const toPage = new URL(`/%23${prevPath}`, window.location.origin);
            const toPageString = toPage.href.replace(/%23/g, '#'); // for HashRouter
            console.info(`To page URL with parameters 2: ${toPageString}`);

            // navigate('/signin');
            // navigate(-2)
            // navigate('/signup');
            console.info('Got Near transaction hashes', transactionHashes);
            console.warn('redirecting back ... 2');
            navigate(toPageString);
        }
    }, [isWalletConnected, transactionHashes]);

    if (loading) {
        return (
            <div className="loading-div">
                <Spin indicator={<LoadingOutlined />} />
            </div>
        );
    }

    return <BrowserWalletContext.Provider value={contextValue}>{children}</BrowserWalletContext.Provider>;
};

export const useBrowserWallet = () => useContext(BrowserWalletContext);
