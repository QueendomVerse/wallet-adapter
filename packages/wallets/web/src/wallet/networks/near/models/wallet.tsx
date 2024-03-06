import { type TransactionsResponseItem } from '../utils/helper-api';
import { type Account } from 'near-api-js';

export enum EnumNetworkSwitch {
  TestNet = 'testnet',
  Mainnet = 'mainnet',
  Betanet = 'betanet',
}

export interface INetworkItemConfig {
  networkId: EnumNetworkSwitch;
  nodeUrl: string;
  helperUrl: string;
  explorerUrl: string;
}

export const DefaultNetWorkConfig = {
  [EnumNetworkSwitch.TestNet]: {
    networkId: EnumNetworkSwitch.TestNet,
    nodeUrl: 'https://rpc.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
  },
  [EnumNetworkSwitch.Mainnet]: {
    networkId: EnumNetworkSwitch.Mainnet,
    nodeUrl: 'https://rpc.mainnet.near.org',
    helperUrl: 'https://helper.mainnet.near.org',
    explorerUrl: 'https://explorer.mainnet.near.org',
  },
  [EnumNetworkSwitch.Betanet]: {
    networkId: EnumNetworkSwitch.Betanet,
    nodeUrl: 'https://rpc.betanet.near.org',
    helperUrl: 'https://helper.betanet.near.org',
    explorerUrl: 'https://explorer.betanet.near.org',
  },
};

export const getNetworkConfig = (network?: string) => {
  const net = Object.values(EnumNetworkSwitch).find(n => n === network);
  if (!net) {
    return DefaultNetWorkConfig['mainnet'] as INetworkItemConfig;
  }
  return DefaultNetWorkConfig[net] as INetworkItemConfig;
};

const model: WalletModelType = {
  namespace: 'wallet',
  state: {
    uiNetworkId: getNetworkConfig().networkId,
    networkConfig: {
      ...DefaultNetWorkConfig,
      // TODO custom config
    },
    account: void 0,
    accountId: void 0,
    publicKey: void 0,
    uiPublicKey: void 0,
    transactions: [],
  },
  reducers: {
    setUiNetworkId(state: WalletStateType, action: { payload: string }) {
      return {
        ...state,
        uiNetworkId: action.payload,
      };
    },
    setAccount(state: WalletStateType, action: { payload: Account }) {
      return {
        ...state,
        account: action.payload,
      };
    },
    setAccountId(state: WalletStateType, action: { payload: string }) {
      localStorage.currentAccountId = action.payload;
      //@ts-ignore
      chrome?.storage?.sync?.set({ currentAccountId: action.payload });
      return {
        ...state,
        accountId: action.payload,
      };
    },
    setPublicKey(state: WalletStateType, action: { payload: string }) {
      return {
        ...state,
        publicKey: action.payload,
        uiPublicKey: action.payload.replace('ed25519:', ''),
      };
    },
    setBalance(state: WalletStateType, action: { payload: IBalanceInfo }) {
      return {
        ...state,
        balanceInfo: action.payload,
      };
    },
    setTransactions(
      state: WalletStateType,
      action: { payload: TransactionsResponseItem },
    ) {
      return {
        ...state,
        transactions: action.payload,
      };
    },
    reStore(state: WalletStateType) {
      return {
        ...state,
        account: void 0,
        accountId: void 0,
        networkConfig: {
          ...DefaultNetWorkConfig,
          // TODO custom config
        },
        uiNetworkId: getNetworkConfig().networkId,
      };
    },
  },
};

export default model;

export interface WalletStateType {
  uiNetworkId: string;
  networkConfig: { [network: string]: INetworkItemConfig };
  account?: Account;
  accountId?: string;
  publicKey?: string;
  uiPublicKey?: string;
  balanceInfo?: IBalanceInfo;
  transactions: TransactionsResponseItem[];
}

interface WalletModelType {
  namespace: 'wallet';
  state: WalletStateType;
  reducers: any;
}

interface IBalanceInfo {
  nearUsdPrice: string;
  myNearPrice: string;
  nearBalance: string;
  uiNearBalance: string;
}
