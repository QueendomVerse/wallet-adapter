// import { IncomingHttpHeaders } from 'http'
import BN from "bn.js";

export * from "./BrowserWalletAdapter";
export * from "./BrowserWallet";

export interface Config {
  networkId: string;
  nodeUrl: string;
  contractName: string;
  marketContractName: string;
  walletUrl: string;
  helperUrl: string;
  GAS: BN;
  headers: {
    [key: string]: string | number;
  };
  // headers?: IncomingHttpHeaders & {
  //   customHeader?: string
  // }
}

export function toArray<Config>(xs: Iterable<Config>): Config[] {
  return [...xs];
}

// class Counter /* implements Iterator<number> */ {
//   private counter = 0;

//   //public next(): IteratorResult<number> {
//   public next(): { done: boolean, value: number } {
//       return {
//           done: false,
//           value: this.counter++
//       }
//   }
// }

// interface IteratorYieldResult<TYield> {
//   done?: false;
//   value: TYield;
// }

// interface IteratorReturnResult<TReturn> {
//   done: true;
//   value: TReturn;
// }

// interface IteratorYieldResult<TYield> {
//   networkId?: string,
//   nodeUrl?: string,
//   contractName?: string,
//   walletUrl?: string,
//   helperUrl?: string,
// }

// interface IteratorReturnResult<TReturn> {
//   networkId: string,
//   nodeUrl: string,
//   contractName: string,
//   walletUrl: string,
//   helperUrl: string,
// }

// type IteratorResult<T, TReturn = any> = IteratorYieldResult<T> |
// IteratorReturnResult<TReturn>;

// interface Iterator<T, TReturn = any, TNext = undefined> {
//   next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
//   return?(value?: TReturn): IteratorResult<T, TReturn>;
//   throw?(e?: any): IteratorResult<T, TReturn>;
// }

// interface Config3<T, TReturn = any, TNext = undefined> {
//   next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
//   return?(value?: TReturn): IteratorResult<T, TReturn>;
//   throw?(e?: any): IteratorResult<T, TReturn>;
// }

interface Iterable<T> {
  [Symbol.iterator](): Iterator<T>;
  networkId: string;
  nodeUrl: string;
  contractName: string;
  walletUrl: string;
  helperUrl: string;
}

// const iterable1 = {};

// iterable1[Symbol.iterator] = function* () {
//   yield 1;
//   yield 2;
//   yield 3;
// };

export const config: Config = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
  contractName: "nft-contract.circlenaut.testnet",
  marketContractName: "market_contract2.circlenaut.testnet",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
  GAS: new BN("200000000000000"),
  headers: { "Content-Type": "application/json" },
};
