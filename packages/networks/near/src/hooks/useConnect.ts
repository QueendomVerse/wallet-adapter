import { Buffer } from 'buffer';
import { useEffect, useState } from 'react';
import * as nearAPI from 'near-api-js';

const { connect, WalletConnection } = nearAPI;

interface ConnectionParams {
    networkId: string;
    keyStore?: nearAPI.keyStores.BrowserLocalStorageKeyStore;
    nodeUrl: string,
    walletUrl: string,
    helperUrl: string,
    explorerUrl: string,
    headers: {}
}


const useConnect = (accountID: string, params: ConnectionParams = {
    networkId: 'testnet',// optional if not signing transactions
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
    headers: {},
}) => {
    window.Buffer = Buffer;
    
    const { keyStores } = nearAPI;
    const keyStore = new keyStores.BrowserLocalStorageKeyStore();

    const [wallet, setWallet] = useState<// nearAPI.WalletConnection | undefined
    nearAPI.WalletConnection>();

    useEffect(() => {
        connect({...params, keyStore}).then((near) => {
            const wallet = new WalletConnection(near, accountID);

            setWallet(wallet);
        });
    }, []);

    return { wallet };
};

export default useConnect;
