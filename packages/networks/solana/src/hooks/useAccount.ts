import { decode as decodeBase58 } from 'bs58';
import type { AccountInfo, Cluster } from '@solana/web3.js';
import { clusterApiUrl, Keypair, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';

import {
    fetchWithRetry, SolanaConnection, SolanaPublicKey, SolanaTransaction
} from '@mindblox-wallet-adapter/base';

// import { ConnectionError } from '../errors';
import { WalletAdapterNetwork } from '../providers';

export interface SendSolana {
    txid: string | undefined;
    gas: number;
}

export interface SolanaAccount {
    connection: () => SolanaConnection;
    keypair: () => Keypair;
    publicKey: () => SolanaPublicKey;
    getPublicKey: (pubKey: string) => SolanaPublicKey;
    account: () => Promise<AccountInfo<Buffer> | null>;
    balance: () => Promise<number>;
    airdrop: () => Promise<string | void>;
    send: (toAddress: string, amount: string) => Promise<SendSolana | undefined>;
    confirm: (transactionId: string) => Promise<boolean>;
}

export const useAccount = async (
    privateKey: string,
    network?: WalletAdapterNetwork,
    nodeRpcUrl?: string,
    nodeWsUrl?: string
): Promise<SolanaAccount> => {
    console.info(`Connecting to solana via RPC: ${nodeRpcUrl ?? network}, WS: ${nodeWsUrl}`);

    const connection = (): SolanaConnection => {
        try {
            const solNetwork: Cluster = network?.toLowerCase() === 'mainnet-beta' ? 'mainnet-beta' : 'devnet';
            return new SolanaConnection(nodeRpcUrl ?? clusterApiUrl(solNetwork), {
                commitment: 'confirmed',
                disableRetryOnRateLimit: true,
                fetch,
                // fetch: fetchWithRetry,
                wsEndpoint: nodeWsUrl,
            });
        } catch (error) {
            console.error('Error establishing connection', error);
            throw error;
        }
    };

    const keypair = (): Keypair => Keypair.fromSecretKey(decodeBase58(privateKey));
    const publicKey = (): SolanaPublicKey => keypair().publicKey;
    const getPublicKey = (pubKey: string): SolanaPublicKey => new SolanaPublicKey(pubKey);

    const account = async (): Promise<AccountInfo<Buffer> | null> => connection().getAccountInfo(keypair().publicKey);
    const balance = async (): Promise<number> =>
        (await connection().getBalance(keypair().publicKey)) / LAMPORTS_PER_SOL;

    const airdrop = async (): Promise<string | void> => {
        if (network && [WalletAdapterNetwork.Devnet, WalletAdapterNetwork.Testnet].includes(network)) {
            await connection().requestAirdrop(keypair().publicKey, LAMPORTS_PER_SOL);
        } else {
            console.warn(`Not possible to airdrop on ${network}`);
        }
    };

    const send = async (toAddress: string, amount: string): Promise<SendSolana | undefined> => {
        if (!amount || isNaN(parseFloat(amount))) return;

        const transaction = new SolanaTransaction();
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: keypair().publicKey,
                toPubkey: getPublicKey(toAddress),
                lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
            })
        );

        try {
            const signature = await sendAndConfirmTransaction(connection(), transaction, [keypair()]);
            const result = await connection().getParsedTransaction(signature);
            return { txid: signature, gas: result?.meta?.fee ? result?.meta?.fee / LAMPORTS_PER_SOL : 0 };
        } catch (err) {
            if (err instanceof Error) {
                console.info(err.message);
                throw err;
            }
            console.info('Unexpected error', err);
        }
    };

    const confirm = async (transactionId: string) => {
        const conn = connection();
        const transactionDetail = await conn.getParsedTransaction(transactionId);
        return !!transactionDetail;
    };

    return { connection, keypair, publicKey, getPublicKey, account, balance, airdrop, send, confirm };
};
