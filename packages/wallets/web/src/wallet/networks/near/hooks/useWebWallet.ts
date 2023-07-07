import { createContext, useContext } from 'react';
import * as bs58 from 'bs58';
import {
  type Connection as SolanaConnection,
  type PublicKey as SolanaPublicKey,
  type Transaction as SolanaTransaction,
  type TransactionSignature as SolanaTransactionSignature
} from '@solana/web3.js';
import {
  type MessageSignerWalletAdapterProps as SolanaMessageSignerWalletAdapterProps,
  type SendTransactionOptions as SolanaSendTransactionOptions,
  type SignerWalletAdapterProps as SolanaSignerWalletAdapterProps,
  type WalletName as SolanaWalletName,
  type WalletAdapter
} from '@solana/wallet-adapter-base';
import {
  formatNearAmount,
  parseNearAmount,
} from 'near-api-js/lib/utils/format';
import { type Provider, type FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { type AccountCreator } from 'near-api-js/lib/account_creator';
import { PublicKey } from 'near-api-js/lib/utils';
import { type AccountView } from 'near-api-js/lib/providers/provider';
import {
  // Near,
  type Account,
  type Connection as NearConnection,
  type WalletConnection,
  connect,
  type Contract,
  type Signer,
  InMemorySigner,
  KeyPair,
} from 'near-api-js';
// import { Transaction, Signature } from 'near-api-js/lib/transaction';
import BN from 'bn.js';

import {
  type NftMetaData
} from 'common/contexts/connection/networks/near';

import { getNetworkConfig } from '../models/wallet';
import { getFiat, getAccountIds } from '../utils/helper-api';
// import { SolanaConnection } from 'common/contexts/connection';

import { config as defaultConfig } from '../config';


interface MockAccount {
  amount: string;
}

class KeyStore {
  keyPair: KeyPair;
  constructor({ keyPair }: { keyPair: KeyPair }) {
    this.keyPair = keyPair;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async setKey(networkId: string, accountId: string, keyPair: KeyPair) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getKey(networkId: string, accountId: string) {
    return this.keyPair;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async removeKey(networkId: string, accountId: string) {}
  async clear() {}
  async getNetworks() {
    return [''];
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAccounts(networkId: string) {
    return [''];
  }
}


function constructMissingProviderErrorMessage(
  action: string,
  valueName: string,
) {
  return (
    'You have tried to ' +
    ` ${action} "${valueName}"` +
    ' on a WalletContext without providing one.' +
    ' Make sure to render a WalletProvider' +
    ' as an ancestor of the component that uses ' +
    'WalletContext'
  );
}

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
//     return Buffer.from(bs58.decode(pubKey)).toString('hex');
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

export interface Send {
  txid: string | undefined;
  gas: string;
}

export interface NftProps {
  metadata: NftMetaData;
  receiverId: string
  perpetualRoyalties?: [string, number][] | undefined
  attachedDeposit?: BN
}

export interface MetadataProps {
  attachedDeposit: BN
  walletMeta: string
  walletCallbackUrl: string
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
  send: (toAddress: string, amount: string) => Promise<Send | undefined>;
  mintAssetToNft: (props: NftProps) => Promise<FinalExecutionOutcome | undefined>;
  displayAllNFT: (accountId: string) => Promise<any>;
  sendMeta: (props: MetadataProps)=> Promise<FinalExecutionOutcome | undefined>;
  loadSaleItems: () => Promise<any[] | undefined>;
  getMinimumStorage: () => Promise<any>;
  approveNFTForSale: (token_id: string, assetPrice: string) => Promise<void>;
  sendStorageDeposit: () => Promise<void>;
  offerPrice: (token_id: string, assetBid: string) => Promise<void>;
}

export const useAccount = (
  privateKey: string,
  network?: string,
): NearAccount => {
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
    
    return near.connection;
  };

  const keypair = () => {
    try {
      return KeyPair.fromString(privateKey);
    } catch (err) {
      console.error(err)
    }
  };

  const account = async () => {
    const near = await _near();
    const id = implicitId();
    if (!near || !id ) return;
    
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

    const pubKey = PublicKey.fromString(pk)
      ?.toString()
      ?.replace('ed25519:', '');
    console.debug('Near implicitId pubkey', pubKey);
    return Buffer.from(bs58.decode(pubKey)).toString('hex');
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
    const near = await _near()
    const conn  = await connection();
    if (!near || !conn) return;

    return {
      provider: conn.provider,
      creator: near.accountCreator,
      signer: conn.signer,
      networkId: conn.networkId,
    } as Info;
  };

  const send = async (
    toAddress: string,
    amount: string,
  ): Promise<Send | undefined> => {
    if (!amount || isNaN(parseFloat(amount))) return;

    const acct: Account | undefined = await account();
    try {
      const result = await acct?.sendMoney(
        toAddress,
        new BN(parseNearAmount(amount) as string),
      );
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
    attachedDeposit = new BN('589700000000000000000000')
  }: NftProps) => {
    const acct: Account | undefined = await account();
    if (!acct) return;

    console.error('func: mintAssetToNft')
    const randomId = new Date().getTime();
    const tokenId = `${metadata.title}-${randomId}`;

    console.info(tokenId, receiverId, attachedDeposit);
    console.dir(perpetualRoyalties);
    console.dir(metadata);
    console.error(acct.accountId, receiverId)

    const functionCallResult = await acct.functionCall({
      contractId: defaultConfig.contractName,
      methodName: "nft_mint",
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
        perpetual_royalties: perpetualRoyalties
      },
      attachedDeposit: attachedDeposit,
    });
    console.dir(functionCallResult)
    return functionCallResult
  };

  const displayAllNFT = async (accountId: string) => {
    const acct: Account | undefined = await account();
    if (!acct) return;

    const result = acct
      .viewFunction(defaultConfig.contractName, "nft_tokens_for_owner", {
        account_id: accountId,
        from_index: "0",
        limit: 64,
      });
    return result;
  };

  const sendMeta = async ({
    attachedDeposit,
    walletMeta,
    walletCallbackUrl
  }: MetadataProps ) => {
    const acct: Account | undefined = await account();
    if (!acct ) return;
    console.warn('func: sendMeta')

    const functionCallResult = await acct.functionCall({
      contractId: defaultConfig.contractName,
      methodName: "new_default_meta",
      args: {
        owner_id: defaultConfig.contractName,
      },
      attachedDeposit: attachedDeposit,
      walletMeta: walletMeta,
      walletCallbackUrl: walletCallbackUrl
    });
    console.dir(functionCallResult);
    return functionCallResult;
  };

  const loadSaleItems = async () => {
    const acct: Account | undefined = await account();
    if (!acct ) return;
    console.warn('func: loadSaleItems')

    const nftTokens = await acct.viewFunction(
      defaultConfig.contractName, "nft_tokens", {
        from_index: "0",
        limit: 64,
      });

    const saleTokens = await acct.viewFunction(
      defaultConfig.marketContractName,
        "get_sales_by_nft_contract_id",
        {
          nft_contract_id: defaultConfig.contractName,
          from_index: "0",
          limit: 64,
        }
      );
    
    const sales = [];

    for (let i = 0; i < nftTokens.length; i++) {
      const { token_id } = nftTokens[i];

      const saleToken = saleTokens.find(({ token_id: t }: {token_id: string}) => t === token_id);
      if (saleToken !== undefined) {
        sales[i] = Object.assign(nftTokens[i], saleToken);
      }
    }
    return sales;
  };

  const getMinimumStorage = async () => {
    const acct: Account | undefined = await account();
    if (!acct ) return;
    console.warn('func: getMinimumStorage')

    const minimum_balance = await acct.viewFunction(
      defaultConfig.marketContractName, "storage_minimum_balance");
    return minimum_balance;
  };

  const sendStorageDeposit = async () => {
    const acct: Account | undefined = await account();
    if (!acct ) return;
    console.warn('func: sendStorageDeposit')

    const minimum = await getMinimumStorage();
    await acct.functionCall({
      contractId: defaultConfig.marketContractName,
      methodName: "storage_deposit",
      args: {},
      attachedDeposit: minimum,
    });
  };

  const approveNFTForSale = async (token_id: string, assetPrice: string) => {
    const acct: Account | undefined = await account();
    if (!acct ) return;
    console.error('func: approveNFTForSale', token_id, assetPrice)


    await sendStorageDeposit();
    const sale_conditions = {
      sale_conditions: assetPrice,
    };
    await acct.functionCall({
      contractId: defaultConfig.contractName,
      methodName: "nft_approve",
      args: {
        token_id: token_id,
        account_id: defaultConfig.marketContractName,
        msg: JSON.stringify(sale_conditions),
      },
      attachedDeposit: new BN(parseNearAmount("0.01")!),
    });
  };

  const offerPrice = async (token_id: string, assetBid: string) => {
    const acct: Account | undefined = await account();
    if (!acct ) return;
    console.warn('func: offerPrice')

    await acct.functionCall({
      contractId: defaultConfig.marketContractName,
      methodName: "offer",
      args: {
        nft_contract_id: defaultConfig.contractName,
        token_id,
      },
      attachedDeposit: new BN(parseNearAmount(assetBid)!),
      gas: defaultConfig.GAS,
    })
  }

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
    displayAllNFT,
    sendMeta,
    loadSaleItems,
    getMinimumStorage,
    approveNFTForSale,
    sendStorageDeposit,
    offerPrice
  };
};

export interface ContractWithMint extends Contract {
  nft_mint?: any;
  nft_tokens_for_owner?: any;
}

export interface WalletContextState {
  adapter?: WalletAdapter | null;
  autoConnect?: boolean;
  wallets?: WalletConnection[]
  wallet: WalletConnection | null;
  publicKey?: SolanaPublicKey | null;
  connecting?: boolean;
  connected?: boolean;
  disconnecting?: boolean;
  select(
    walletName: SolanaWalletName,
    // chain?: string,
    // label?: string,
    // privateKey?: Uint8Array
  ): Promise<void>;
  connect(
    // publicKey: SolanaPublicKey,
    chain?: string,
    label?: string,
    privateKey?: Uint8Array
  ): Promise<void>;
  disconnect(): Promise<void>;
  sendTransaction(
    transaction: SolanaTransaction,
    // connection: Connection,
    connection: SolanaConnection,
  ): Promise<SolanaTransactionSignature>;

  signTransaction: SolanaSignerWalletAdapterProps['signTransaction'] | undefined;
  signAllTransactions:
    | SolanaSignerWalletAdapterProps['signAllTransactions']
    | undefined;
  signMessage: SolanaMessageSignerWalletAdapterProps['signMessage'] | undefined;

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
  autoConnect: false,
  connecting: false,
  connected: false,
  disconnecting: false,

  select(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // _walletName: SolanaWalletName,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // _chain: string,
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // _label: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // _privateKey: string
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // _privateKey: Uint8Array,
  ) {
    return Promise.reject(
      console.error(constructMissingProviderErrorMessage('get', 'select'))
    );
  },
  connect(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // _publicKey: SolanaPublicKey,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _chain: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _label: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // _privateKey: string
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _privateKey: Uint8Array
  ) {
    return Promise.reject(
      console.error(constructMissingProviderErrorMessage('get', 'connect')),
    );
  },
  disconnect() {
    return Promise.reject(
      console.error(constructMissingProviderErrorMessage('get', 'disconnect')),
    );
  },
  sendTransaction(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _transaction: SolanaTransaction,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _connection: SolanaConnection,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: SolanaSendTransactionOptions,
  ) {
    return Promise.reject(
      console.error(
        constructMissingProviderErrorMessage('get', 'sendTransaction'),
      ),
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  signTransaction(_transaction: SolanaTransaction) {
    return Promise.reject(
      console.error(
        constructMissingProviderErrorMessage('get', 'signTransaction'),
      ),
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  signAllTransactions(_transaction: SolanaTransaction[]) {
    return Promise.reject(
      console.error(
        constructMissingProviderErrorMessage('get', 'signAllTransactions'),
      ),
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  signMessage(_message: Uint8Array) {
    return Promise.reject(
      console.error(constructMissingProviderErrorMessage('get', 'signMessage')),
    );
  },
  wallet: null,
  contract: null,
  currentAccount: {
    accountId: "",
    balance: "",
  },
  signIn: async () => {},
  signOut: async () => {},
  isSignedIn: false,
  // loadAccount: () => {},
};

export const WalletContext = createContext(initialState);

export const useWebWallet = (): WalletContextState => {
  return useContext(WalletContext);
}
