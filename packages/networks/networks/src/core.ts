import type { LocalKeypairStore, ChainTicker } from '@mindblox-wallet-adapter/base';
import { ChainTickers, LocalWalletStore } from '@mindblox-wallet-adapter/base';
import type { SendNear, SendSolana } from '.';
import { getNearBalance, getSolanaBalance, sendNearFundsTransaction, sendSolanaFundsTransaction } from '.';

export const getBalance = async (ticker: string, keypair: LocalKeypairStore) => {
    // console.debug(`Getting balance (${ticker}): ${keypair.publicKey}`);
    if (!keypair.privateKey) return;

    switch (ticker) {
        case ChainTickers.SOL:
            return await getSolanaBalance({privateKey: keypair.privateKey});
        case ChainTickers.NEAR:
            return await getNearBalance({privateKey: keypair.privateKey});
        default:
            throw new Error(`Invalid chain ticker '${ticker}'!`);
    }
};

export const sendFundsTransaction = async (
    ticker: ChainTicker,
    keypair: LocalKeypairStore,
    toAddress: string,
    amount: string
): Promise<SendSolana | SendNear | undefined> => {
    if (!keypair.privateKey) {
        throw new Error('Private key is missing!');
    }

    switch (ticker) {
        case ChainTickers.SOL:
            return await sendSolanaFundsTransaction({privateKey: keypair.privateKey}, toAddress, amount);
        case ChainTickers.NEAR:
            return await sendNearFundsTransaction({privateKey: keypair.privateKey}, toAddress, amount);
        default:
            throw new Error(`Invalid chain ticker '${ticker}'!`);
    }
};
