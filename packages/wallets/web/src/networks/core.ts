import { ChainTickers } from '../chains';
import type {
    LocalKeyPairStore,
    // LocalWalletStore,
} from '../store';
import type { LocalWalletStore } from '../store';
import type { IndexDbWallet } from '../indexDb';
import { getBalance as getSolanaBalance, sendFundsTransaction as sendSolanaFundsTransaction } from './solana';
import { getBalance as getNearBalance, sendFundsTransaction as sendNearFundsTransaction } from './near';
import type { SendNear, SendSolana } from '.';

export const getBalance = async (ticker: string, keypair: LocalKeyPairStore) => {
    // console.debug(`Getting balance (${ticker}): ${keypair.publicKey}`);
    if (!keypair.privateKey) return;

    switch (ticker) {
        case ChainTickers.SOL:
            return await getSolanaBalance(keypair.privateKey);
        case ChainTickers.NEAR:
            return await getNearBalance(keypair.privateKey);
        default:
            throw new Error(`Invalid chain ticker '${ticker}'!`);
    }
};

export const sendFundsTransaction = async (
    ticker: string,
    keypair: LocalKeyPairStore,
    toAddress: string,
    amount: string
): Promise<SendSolana | SendNear | undefined> => {
    if (!keypair.privateKey) {
        throw new Error('Private key is missing!');
    }

    switch (ticker) {
        case ChainTickers.SOL:
            return await sendSolanaFundsTransaction(keypair.privateKey, toAddress, amount);
        case ChainTickers.NEAR:
            return await sendNearFundsTransaction(keypair.privateKey, toAddress, amount);
        default:
            throw new Error(`Invalid chain ticker '${ticker}'!`);
    }
};

export const getValidWallets = (wallets: (LocalWalletStore | undefined)[]) => {
    return wallets.filter((w): w is LocalWalletStore => !!w);
};

export const getValidDbWallets = (wallets: (IndexDbWallet | undefined)[]) => {
    return wallets.filter((w): w is IndexDbWallet => !!w);
};

export const getPrimaryWallet = (wallets: LocalWalletStore[]) => {
    return wallets.find((w) => w.label === 'primary');
};
