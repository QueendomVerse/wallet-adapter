import type { FC, ReactNode } from 'react';
import React, { useState, useEffect, useMemo } from 'react';
import {
    // connect as connectNear,
    keyStores,
    // InMemorySigner
} from 'near-api-js';
import { useLocation, useNavigate } from 'react-router-dom';
import type { BrowserWalletConfig } from '..';
import { BrowserWallet } from '..';

import type { Config } from '../config';
import { config as defaultConfig } from '../config';

import { initialState, WalletContext } from '../hooks';
// import { QueryParams } from '@/utils';

interface Props {
    children: ReactNode;
    config?: Config;
}

export const WalletProvider: FC<Props> = ({ config, children }) => {
    const [
        {
            chain,
            autoConnect,
            wallets,
            wallet,
            publicKey,
            connected,
            connecting,
            disconnecting,
            select,
            connect,
            disconnect,
            sendTransaction,
            signTransaction,
            signAllTransactions,
            signMessage,
            currentAccount,
            contract,
            isSignedIn,
            signIn,
            signOut,
        },
        setState,
    ] = useState(initialState);
    const [nearConfig, setNearConfig] = useState<Config>(defaultConfig);
    const [nearBrowserWalletConfig, setNearBrowserWalletConfig] = useState<BrowserWalletConfig>({
        ...defaultConfig,
    });

    const useQuerySearch = () => {
        return new URLSearchParams(useLocation().search);
    };

    const navigate = useNavigate();
    //   const searchParams = useQuerySearch();

    //   const routerQuery = Array.from(searchParams.entries()).reduce((acc, [key, value]) => ({
    //     ...acc,
    //     [key]: value
    //   }), {}) as QueryParams;

    useMemo(() => {
        if (!config) return;
        console.info('config');
        console.dir(config);
        setNearConfig(config);
        setNearBrowserWalletConfig({ ...config });
    }, [config]);

    // useMemo(async () => {
    useEffect(() => {
        const init = async () => {
            // construct the redirect string
            // console.debug("document.URL 0", document.URL)

            const keyStore = new keyStores.BrowserLocalStorageKeyStore();
            // console.info('keyStore')
            // console.dir(keyStore)

            // const near = await connectNear({
            //   networkId: nearConfig.networkId,
            //   signer: new InMemorySigner(keyStore),
            //   nodeUrl: nearConfig.nodeUrl,
            //   // contractName: nearConfig.contractName,
            //   walletUrl: nearConfig.walletUrl,
            //   helperUrl: nearConfig.helperUrl,
            //   // keyStore: keyStore,
            //   headers: { 'Content-Type': 'application/json' },
            // });

            // construct the redirect string
            // console.debug("document.URL 1", document.URL)

            // console.debug('networks')
            console.dir(await keyStore.getNetworks());

            // let wallet: WalletConnection;
            let wallet: BrowserWallet;
            try {
                // wallet = new WalletConnection(near, "helloworld");
                wallet = new BrowserWallet(nearBrowserWalletConfig, {});
            } catch (e) {
                console.error('wallet connection error: ', e);
                return;
            }

            const redirectUrl = new URL(document.URL);
            const getPrevPath = () => {
                const prevHash = redirectUrl.hash.split('#');
                if (prevHash.length < 2) return '';

                return prevHash[1] ?? redirectUrl.pathname;
            };

            // construct the redirect string
            // console.debug("document.URL 2", document.URL)

            const nearAccountId = wallet.accountId;

            // const toPage = new URL('/%23/signin', window.location.origin);
            // const fromPage = history.state.from;
            const prevPath = getPrevPath();

            // const toPage = new URL('/%23/signup', window.location.origin);
            const toPage = new URL(`/%23${prevPath}`, window.location.origin);
            for (const [key, value] of redirectUrl.searchParams.entries()) {
                toPage.searchParams.append(key, value);
            }
            const toPageString = toPage.href.replace(/%23/g, '#'); // for HashRouter
            console.info(`To page URL with parameters: ${toPageString}`);

            if (nearAccountId) {
                const accountState = await wallet.account?.state();

                console.debug('keys');
                const keys = await keyStore.getKey(nearConfig.networkId, nearAccountId);
                console.dir(keys);
                if (!keys) {
                    console.warn('redirecting back ...');
                    navigate('#/near');

                    return;
                }

                // const accountState = await wallet.account().state();
                // initial contract.
                // const account = wallet.account;

                // const contract: Contract = new Contract(
                //   wallet.account,
                //   nearConfig.contractName,
                //   {
                //     viewMethods: ["nft_tokens_for_owner"],
                //     changeMethods: ["nft_mint"],
                //   }
                // );
                // setState({
                //     select: select,
                //     wallets: wallets,
                //     connect: connect,
                //     disconnect: disconnect,
                //     sendTransaction: sendTransaction,
                //     signTransaction: signTransaction,
                //     signAllTransactions: signAllTransactions,
                //     signMessage: signMessage,
                //     //@ts-ignore
                //     wallet: wallet,
                //     // contract: wallet.contract!,
                //     contract: contract,
                //     currentAccount: {
                //         accountId: nearAccountId,
                //         balance: accountState?.amount ?? '0',
                //     },
                //     // signIn: async () => {
                //     //   console.info("Requesting Sign in 0")
                //     //   await wallet.requestSignIn({
                //     //     contractId: nearConfig.contractName,
                //     //     successUrl: toPageString,
                //     //     failureUrl: toPageString
                //     //   });
                //     // },
                //     // signOut: () => wallet.signOut(),
                //     signOut: signOut,
                //     // isSignedIn: wallet.isSignedIn(),
                //     isSignedIn: isSignedIn,
                // });
            } else {
                setState({
                    ...initialState,
                    signIn: async () => {
                        console.info('Requesting Near sign in ...');
                        await wallet.requestSignIn(nearConfig.contractName, toPageString, toPageString);
                    },
                });
            }
            console.debug('redirecting back ... ');
            navigate(toPageString);
        };
        init();
    }, [nearConfig]);

    return (
        <WalletContext.Provider
            value={{
                chain,
                autoConnect,
                wallets,
                wallet,
                publicKey,
                connected,
                connecting,
                disconnecting,
                select,
                connect,
                disconnect,
                sendTransaction,
                signTransaction,
                signAllTransactions,
                signMessage,
                currentAccount,
                contract,
                isSignedIn,
                signIn,
                signOut,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export default WalletProvider;
