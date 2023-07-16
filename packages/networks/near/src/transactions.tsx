import { connect, Account } from 'near-api-js';
import type { TransactionParams } from './types';

const nearConfig = {
    networkId: 'default',
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    keyPath: '~/.near/credentials/default/test.near.json',
};

export const sendTransaction = async (params: TransactionParams) => {
    try {
        // Initiate the transaction, notice the amount is in near units
        console.log(`Sending ${params.amount.toString()} tokens to ${params.receiver}`);
        const result = await params.sender.sendMoney(params.receiver, params.amount);
        return result;
    } catch (error) {
        console.error('Send Transaction Error: ', error);
    }
};

export const getTransactionStatus = async (txHash: Uint8Array, sender: string) => {
    const near = await connect(nearConfig);
    const provider = near.connection.provider;

    // Get transaction status
    const status = await provider.txStatus(txHash, sender);
    if (status.status) {
        return { status: 'Transaction Successful', transaction: status };
    } else {
        return { status: 'Transaction Failed', transaction: status };
    }
};

export const signAndSendTransaction = async (receiverId: string, sender: string, actions: any[]) => {
    const near = await connect(nearConfig);
    const account = new Account(near.connection, sender);

    const result = await account.signAndSendTransaction({
        receiverId,
        actions,
    });

    const txHash = new Uint8Array(result.transaction.hash.buffer);

    return getTransactionStatus(txHash, sender);
};
