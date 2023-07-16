import { createContext, useContext } from 'react';
import { decode as decodeBase58 } from 'bs58';

import { formatNearAmount, parseNearAmount } from 'near-api-js/lib/utils/format';
import { type Provider, type FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { type AccountCreator } from 'near-api-js/lib/account_creator';
import { PublicKey } from 'near-api-js/lib/utils';
import { type AccountView } from 'near-api-js/lib/providers/provider';
import {
    // Near,
    type Account,
    type WalletConnection,
    connect,
    type Contract,
    type Signer,
    InMemorySigner,
    KeyPair,
} from 'near-api-js';
// import { Transaction, Signature } from 'near-api-js/lib/transaction';
import BN from 'bn.js';

import type {
    Adapter,
    Chain,
    NearConnection,
    NearPublicKey,
    NearTransaction,
    NearTransactionSignature,
    Wallet,
    SendTransactionOptions,
    NearSigner,
    NearSendOptions,
    SignerWalletAdapterProps,
    MessageSignerWalletAdapterProps,
    WalletName,
} from '@mindblox-wallet-adapter/base';
import { ChainNetworks, WalletName as SolanaWalletName, WalletReadyState } from '@mindblox-wallet-adapter/base';

import { type NftMetaData } from '../types';
import { getNetworkConfig } from '../models/wallet';

import { config as defaultConfig } from '../config';
import { getAccountIds, getFiat } from '../utils';

interface MockAccount {
    amount: string;
}

export type NearAdapter = Adapter<NearPublicKey, NearTransaction, NearConnection, NearTransactionSignature>;

class KeyStore {
    keyPair: KeyPair;
    constructor({ keyPair }: { keyPair: KeyPair }) {
        this.keyPair = keyPair;
    }

    async setKey(/*networkId: string, accountId: string, keyPair: KeyPair*/) {
        // TODO: implement setKey logic
        return Promise.resolve();
    }

    async getKey(/*networkId: string, accountId: string*/) {
        return this.keyPair;
    }

    async removeKey(/*networkId: string, accountId: string*/) {
        // TODO: implement removeKey logic
        return Promise.resolve();
    }

    async clear() {
        // TODO: implement clear logic
        return Promise.resolve();
    }

    async getNetworks() {
        return [''];
    }

    async getAccounts(/*networkId: string*/) {
        return [''];
    }
}

const constructMissingProviderErrorMessage = (action: string, valueName: string) => {
    return (
        'You have tried to ' +
        ` ${action} "${valueName}"` +
        ' on a WalletContext without providing one.' +
        ' Make sure to render a WalletProvider' +
        ' as an ancestor of the component that uses ' +
        'WalletContext'
    );
};

interface Balance {
    balance: string;
    usdPrice: string;
    usdBalance: string;
    uiBalance: string;
}

interface Info {
    provider: Provider;
    creator?: AccountCreator;
    signer: Signer;
    networkId: string;
}

// export const fetchAccount = (name: string, network?: string) => {
//   const currentNetwork = getNetworkConfig(network);

//   const _near = async () => {
//     return await connect({
//       networkId: currentNetwork.networkId,
//       nodeUrl: currentNetwork.nodeUrl,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   };

//   const connection = async () => {
//     return (await _near()).connection
//   };

//   const account = async () => {
//     const near: Near = await _near();
//     try {
//       return await near?.account(name);
//     } catch (e) {
//       console.error(e)
//     };
//   };

//   const publicKey = () => {
//     const pubKey = keypair().getPublicKey();
//     console.debug(`Near pubKey`, pubKey);
//     return pubKey
//     .toString()
//     .substring(8, pubKey.toString().length);
//   };

//   const implicitId = () => {
//     const pubKey = PublicKey.fromString(publicKey()).toString().replace('ed25519:', '');
//     console.debug('Near implicitId pubkey', pubKey);
//     return Buffer.from(decodeBase58(pubKey)).toString('hex');
//   };

//   const balance = async () => {
//     const acct: Account | undefined = await account();
//     let info: AccountView | MockAccount;
//     try {
//       info = await acct?.state() as AccountView;
//       //@TODO: be specific about capturing account not exist error.
//     } catch (e) {
//       console.error(e);
//       info = {
//         amount: "0"
//       } as MockAccount;
//     };
//     const prices = await getFiat({
//       ACCOUNT_HELPER_URL: currentNetwork.helperUrl,
//     });
//     const balance = formatNearAmount(info?.amount ?? "");
//     const usdPrice = prices?.near?.usd;

//     return {
//       balance: balance,
//       usdPrice: usdPrice.toFixed(2),
//       usdBalance: (parseInt(balance) * usdPrice).toFixed(2),
//       uiBalance: parseInt(balance).toFixed(4),
//     } as Balance;
//   };

//   const info = async () => {
//     const conn: Connection = await connection();
//     return {
//       provider: conn.provider,
//       creator: (await _near()).accountCreator,
//       signer: conn.signer,
//       networkId: conn.networkId
//     } as Info;
//   };

//   return {
//     connection,
//     account,
//     balance,
//     info
//   };
// };

export interface SendNear {
    txid: string | undefined;
    gas: string;
}

export interface NftProps {
    metadata: NftMetaData;
    receiverId: string;
    perpetualRoyalties?: [string, number][] | undefined;
    attachedDeposit?: BN;
}

export interface MetadataProps {
    attachedDeposit: BN;
    walletMeta: string;
    walletCallbackUrl: string;
}

export interface NearAccount {
    connection: () => Promise<NearConnection | undefined>;
    keypair: () => KeyPair | undefined;
    account: () => Promise<Account | undefined>;
    publicKey: () => string | undefined;
    implicitId: () => string | undefined;
    id: () => Promise<string | undefined>;
    balance: () => Promise<Balance>;
    info: () => Promise<Info | undefined>;
    send: (toAddress: string, amount: string) => Promise<SendNear | undefined>;
    mintAssetToNft: (props: NftProps) => Promise<FinalExecutionOutcome | undefined>;
    displayAllNFTs: (accountId: string) => Promise<Record<string, unknown>[] | undefined>;
    sendMeta: (props: MetadataProps) => Promise<FinalExecutionOutcome | undefined>;
    loadSaleItems: () => Promise<Record<string, unknown>[] | undefined>;
    getMinimumStorage: () => Promise<BN | undefined>;
    approveNFTForSale: (token_id: string, assetPrice: string) => Promise<void>;
    sendStorageDeposit: () => Promise<void>;
    offerPrice: (token_id: string, assetBid: string) => Promise<void>;
}

export const useAccount = (privateKey?: string, network?: string): NearAccount => {
    const currentNetwork = getNetworkConfig(network);

    const _near = async () => {
        const kp = keypair();
        if (!kp) return;

        const keyStore = new KeyStore({ keyPair: kp });
        return await connect({
            networkId: currentNetwork.networkId,
            signer: new InMemorySigner(keyStore),
            nodeUrl: currentNetwork.nodeUrl,
            headers: { 'Content-Type': 'application/json' },
        });
    };

    const connection = async () => {
        const near = await _near();
        if (!near) return;

        return near.connection as NearConnection;
    };

    const keypair = () => {
        try {
            if (!privateKey) {
                console.warn(`Unable to get Near keypair: No private key provided`);
                return;
            }
            return KeyPair.fromString(privateKey);
        } catch (err) {
            console.error(err);
        }
    };

    const account = async () => {
        const near = await _near();
        const id = implicitId();
        if (!near || !id) return;

        try {
            return await near?.account(id);
        } catch (e) {
            console.error(e);
        }
    };

    const publicKey = () => {
        const kp = keypair();
        if (!kp) return;

        const pubKey = kp.getPublicKey();
        console.debug(`Near pubKey`, pubKey.toString());
        return pubKey.toString().substring(8, pubKey.toString().length);
    };

    const implicitId = () => {
        const pk = publicKey();
        if (!pk) return;

        const pubKey = PublicKey.fromString(pk)?.toString()?.replace('ed25519:', '');
        console.debug('Near implicitId pubkey', pubKey);
        return Buffer.from(decodeBase58(pubKey)).toString('hex');
    };

    const id = async (): Promise<string | undefined> => {
        const kp = keypair();
        if (!kp) return;

        const acctIdsByPubKey = await getAccountIds({
            publicKey: kp.getPublicKey(),
            ACCOUNT_HELPER_URL: currentNetwork.helperUrl,
        });
        return acctIdsByPubKey[0];
    };

    const balance = async () => {
        const acct: Account | undefined = await account();
        let info: AccountView | MockAccount;
        try {
            info = (await acct?.state()) as AccountView;
            //@TODO: be specific about capturing account not exist error.
        } catch (e) {
            console.error(e);
            info = {
                amount: '0',
            } as MockAccount;
        }
        const prices = await getFiat({
            ACCOUNT_HELPER_URL: currentNetwork.helperUrl,
        });
        const balance = formatNearAmount(info?.amount ?? '');
        const usdPrice = prices?.near?.usd;

        return {
            balance: balance,
            usdPrice: usdPrice.toFixed(2),
            usdBalance: (parseInt(balance) * usdPrice).toFixed(2),
            uiBalance: parseInt(balance).toFixed(4),
        } as Balance;
    };

    const info = async () => {
        const near = await _near();
        const conn = await connection();
        if (!near || !conn) return;

        return {
            provider: conn.provider,
            creator: near.accountCreator,
            signer: conn.signer,
            networkId: conn.networkId,
        } as Info;
    };

    const send = async (toAddress: string, amount: string): Promise<SendNear | undefined> => {
        if (!amount || isNaN(parseFloat(amount))) return;

        const acct: Account | undefined = await account();
        try {
            const result = await acct?.sendMoney(toAddress, new BN(parseNearAmount(amount) as string));
            const gas = result?.transaction_outcome.outcome.gas_burnt;
            return {
                txid: result?.transaction_outcome.id,
                gas: formatNearAmount(gas?.toString() ?? ''),
            };
        } catch (err) {
            console.error(err);
        }
    };

    const mintAssetToNft = async ({
        metadata,
        receiverId,
        perpetualRoyalties,
        attachedDeposit = new BN('589700000000000000000000'),
    }: NftProps) => {
        const acct: Account | undefined = await account();
        if (!acct) return;

        console.debug('func: mintAssetToNft');
        const randomId = new Date().getTime();
        const tokenId = `${metadata.title}-${randomId}`;

        console.info(tokenId, receiverId, attachedDeposit);
        console.dir(perpetualRoyalties);
        console.dir(metadata);
        console.debug(acct.accountId, receiverId);

        const functionCallResult = await acct.functionCall({
            contractId: defaultConfig.contractName,
            methodName: 'nft_mint',
            args: {
                token_id: tokenId,
                metadata: {
                    title: metadata.title ?? '',
                    description: metadata.description ?? '',
                    media: metadata.media ?? '',
                    // media_hash: `${metadata.mediaHash ?? ''}`,
                    copies: metadata.copies ?? 1,
                    issued_at: metadata.issuedAt ?? Date.now(),
                    // expires_at: Date.now(),
                    starts_at: metadata.startsAt ?? Date.now(),
                    // updated_at: `${metadata.updatedAt ?? ''}`,
                    // extra: metadata.extra ?? '',
                    reference: metadata.reference ?? '',
                    // reference_hash: `${metadata.referenceHash ?? ''}`
                },
                // receiver_id: `${receiverId}`,
                receiver_id: acct.accountId,
                perpetual_royalties: perpetualRoyalties,
            },
            attachedDeposit: attachedDeposit,
        });
        console.dir(functionCallResult);
        return functionCallResult;
    };

    const displayAllNFTs = async (accountId: string): Promise<Record<string, unknown>[] | undefined> => {
        const acct: Account | undefined = await account();
        if (!acct) return;

        const result = await acct.viewFunction({
            contractId: defaultConfig.contractName,
            methodName: 'nft_tokens_for_owner',
            args: {
                account_id: accountId,
                from_index: '0',
                limit: 64,
            },
        });
        return result;
    };

    const sendMeta = async ({ attachedDeposit, walletMeta, walletCallbackUrl }: MetadataProps) => {
        const acct: Account | undefined = await account();
        if (!acct) return;
        console.warn('func: sendMeta');

        const functionCallResult = await acct.functionCall({
            contractId: defaultConfig.contractName,
            methodName: 'new_default_meta',
            args: {
                owner_id: defaultConfig.contractName,
            },
            attachedDeposit: attachedDeposit,
            walletMeta: walletMeta,
            walletCallbackUrl: walletCallbackUrl,
        });
        console.dir(functionCallResult);
        return functionCallResult;
    };

    const loadSaleItems = async (): Promise<Record<string, unknown>[] | undefined> => {
        const acct: Account | undefined = await account();
        if (!acct) return;
        console.warn('func: loadSaleItems');

        const nftTokens = await acct.viewFunction({
            contractId: defaultConfig.contractName,
            methodName: 'nft_tokens',
            args: {
                from_index: '0',
                limit: 64,
            },
        });

        const saleTokens = await acct.viewFunction({
            contractId: defaultConfig.marketContractName,
            methodName: 'get_sales_by_nft_contract_id',
            args: {
                nft_contract_id: defaultConfig.contractName,
                from_index: '0',
                limit: 64,
            },
        });

        const sales = [];

        for (let i = 0; i < nftTokens.length; i++) {
            const { token_id } = nftTokens[i];

            const saleToken = saleTokens.find(({ token_id: t }: { token_id: string }) => t === token_id);
            if (saleToken !== undefined) {
                sales[i] = Object.assign(nftTokens[i], saleToken);
            }
        }
        return sales;
    };

    const getMinimumStorage = async (): Promise<BN | undefined> => {
        const acct: Account | undefined = await account();
        if (!acct) return;
        console.warn('func: getMinimumStorage');

        const minimum_balance: BN = await acct.viewFunction({
            contractId: defaultConfig.marketContractName,
            methodName: 'storage_minimum_balance',
        });
        return minimum_balance;
    };

    const sendStorageDeposit = async () => {
        const acct: Account | undefined = await account();
        if (!acct) return;
        console.warn('func: sendStorageDeposit');

        const minimum: BN | undefined = await getMinimumStorage();
        if (!minimum) return;

        await acct.functionCall({
            contractId: defaultConfig.marketContractName,
            methodName: 'storage_deposit',
            args: {},
            attachedDeposit: minimum,
        });
    };

    const approveNFTForSale = async (token_id: string, assetPrice: string) => {
        const acct: Account | undefined = await account();
        if (!acct) return;
        console.debug('func: approveNFTForSale', token_id, assetPrice);

        await sendStorageDeposit();
        const sale_conditions = {
            sale_conditions: assetPrice,
        };

        const depositAmount = parseNearAmount('0.01');
        if (!depositAmount) throw new Error('Could not parse deposit amount');

        await acct.functionCall({
            contractId: defaultConfig.contractName,
            methodName: 'nft_approve',
            args: {
                token_id: token_id,
                account_id: defaultConfig.marketContractName,
                msg: JSON.stringify(sale_conditions),
            },
            attachedDeposit: new BN(depositAmount),
        });
    };

    const offerPrice = async (token_id: string, assetBid: string) => {
        const acct: Account | undefined = await account();
        if (!acct) return;
        console.warn('func: offerPrice');

        const parsedAssetBid = parseNearAmount(assetBid);
        if (!parsedAssetBid) throw new Error('AssetBid cannot be parsed');

        await acct.functionCall({
            contractId: defaultConfig.marketContractName,
            methodName: 'offer',
            args: {
                nft_contract_id: defaultConfig.contractName,
                token_id,
            },
            attachedDeposit: new BN(parsedAssetBid.toString()),
            gas: defaultConfig.GAS,
        });
    };

    return {
        connection,
        keypair,
        account,
        publicKey,
        implicitId,
        id,
        balance,
        info,
        send,
        mintAssetToNft,
        displayAllNFTs,
        sendMeta,
        loadSaleItems,
        getMinimumStorage,
        approveNFTForSale,
        sendStorageDeposit,
        offerPrice,
    };
};

export interface ContractWithMint extends Contract {
    nft_mint?: Record<string, unknown>[] | undefined;
    nft_tokens_for_owner?: Record<string, unknown>[] | undefined;
}

export interface NearWallet
    extends WalletConnection,
        Wallet<NearPublicKey, NearTransaction, NearConnection, NearTransactionSignature> {}

export interface WalletContextState {
    chain: Chain | null;
    adapter?: NearAdapter | null;
    autoConnect?: boolean;
    wallets: NearWallet[];
    wallet: NearWallet | null;
    publicKey?: NearPublicKey | null;
    connecting?: boolean;
    connected?: boolean;
    disconnecting?: boolean;
    select(
        walletName: WalletName
        // chain?: Chain,
        // label?: string,
        // privateKey?: Uint8Array
    ): Promise<void>;
    connect(chain?: Chain, label?: string, privateKey?: Uint8Array): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction(
        transaction: NearTransaction,
        // connection: Connection,
        connection: NearConnection
    ): Promise<NearTransactionSignature>;

    signTransaction: SignerWalletAdapterProps<NearTransaction>['signTransaction'] | undefined;
    signAllTransactions: SignerWalletAdapterProps<NearTransaction>['signAllTransactions'] | undefined;
    signMessage: MessageSignerWalletAdapterProps['signMessage'] | undefined;

    contract: ContractWithMint | null;
    currentAccount?: {
        accountId: string;
        balance: string;
    };
    signIn: () => Promise<void>;
    signOut: () => void;
    isSignedIn: boolean;
}

export const initialState: WalletContextState = {
    chain: ChainNetworks.NEAR,
    autoConnect: false,
    connecting: false,
    connected: false,
    disconnecting: false,
    wallets: [],

    select() // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // _walletName: WalletName,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // _chain: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // _label: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // _privateKey: string
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // _privateKey: Uint8Array,
    {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'select')));
    },
    connect(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // _publicKey: NearPublicKey,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _chain: Chain,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _label: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // _privateKey: string
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _privateKey: Uint8Array
    ) {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'connect')));
    },
    disconnect() {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'disconnect')));
    },
    sendTransaction(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _transaction: NearTransaction,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _connection: NearConnection,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _options?: SendTransactionOptions<NearSigner, NearSendOptions>
    ) {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'sendTransaction')));
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signTransaction(_transaction: NearTransaction) {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'signTransaction')));
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signAllTransactions(_transaction: NearTransaction[]) {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'signAllTransactions')));
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signMessage(_message: Uint8Array) {
        return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'signMessage')));
    },
    wallet: null,
    contract: null,
    currentAccount: {
        accountId: '',
        balance: '',
    },
    signIn: async () => {
        console.info('Signing in ...');
        return Promise.resolve();
    },
    signOut: async () => {
        console.info('Signing out ...');
        return Promise.resolve();
    },
    isSignedIn: false,
    // loadAccount: () => {},
};

export const WalletContext = createContext(initialState);

export const useWallet = (): WalletContextState => {
    return useContext(WalletContext);
};
