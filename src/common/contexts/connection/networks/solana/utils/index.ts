import getConfig from "next/config";

import { WalletAdapterNetwork } from "../../core";
import type { AccountDatum } from "../internal/accounts/types";
import { getAdapterNetwork } from "../../core";

const { publicRuntimeConfig } = getConfig();

export const accountsEqual = (a: AccountDatum, b: AccountDatum): boolean => {
  if (a && b) {
    return a.accountInfo.data.equals(b.accountInfo.data);
  }
  return false;
};

export function chunks<T>(array: readonly T[], size: number): T[][] {
  return Array.apply<number, T[], T[][]>(
    0,
    new Array(Math.ceil(array.length / size)) as T[]
  ).map((_, index) => array.slice(index * size, (index + 1) * size));
}

export const getSolanaNetwork = () =>
  getAdapterNetwork(publicRuntimeConfig.publicSolanaNetwork);
