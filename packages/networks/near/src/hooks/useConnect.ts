import { Buffer } from 'buffer';
import { useEffect, useState } from 'react';
import * as nearAPI from 'near-api-js';
import { keyStore } from '../utils';

window.Buffer = Buffer;

const { connect, WalletConnection } = nearAPI;

const config = {
    networkId: 'testnet',
    keyStore, // optional if not signing transactions
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
    headers: {},
};

const useConnect = (accountID: string) => {
    const [wallet, setWallet] = useState<// nearAPI.WalletConnection | undefined
    nearAPI.WalletConnection>();

    useEffect(() => {
        connect(config).then((near) => {
            const wallet = new WalletConnection(near, accountID);

            setWallet(wallet);
        });
    }, []);

    return { wallet };
};

export default useConnect;
