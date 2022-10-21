import { ChainNetworks } from "../../contexts/connection/chains";
// import {
//   useWallet
// } from '../../contexts/connection/networks/solana';
import {
  WalletContextState as SolanaWalletContextState,
  WalletContextState as NearWalletContextState,
} from "../../contexts/connection/networks/near";

import {
  getAccount as getSolanaAccount,
  // getWallet as getSolanaWallet,
} from "./solana";
import { getAccount as getNearAccount } from "./near";
import { KeyPair as lKeypair } from "../../store/types/webWalletTypes";
import { UseAccount, Solana, Near } from "../../utils/wallets/types";

import { getSavedWallet } from "../../localDB/api";

export type WalletContextState =
  | SolanaWalletContextState
  | NearWalletContextState;

export const getWallet = async (
  chain?: string,
  keypair?: lKeypair
  // ): SolanaWalletContextState => {
) => {
  // const fetchDbWallet = useCallback(async (publicKey: string) => {
  //   //@TODO impliment and add thunkFetchWallet
  //   return await getSavedWallet(publicKey);
  // }, []);

  if (!keypair?.publicKey) return;

  // const wlt = await fetchDbWallet(keypair?.publicKey);
  const wlt = await getSavedWallet(keypair?.publicKey);
  return wlt;
};

// export const getWallet = async (chain: string, keypair: lKeypair): Promise<Account | undefined> => {
//   if (!keypair.privateKey) return;
//   switch (chain) {
//     case ChainNetworks.SOL:
//       return await getSolanaWallet(keypair.privateKey);
//     case ChainNetworks.NEAR:
//       return await getNearWallet(keypair.privateKey);
//     default:
// throw new Error(`Invalid chain network '${chain}'!`);
//   }
// };

export const getAccount = async (
  chain: string,
  keypair: lKeypair
): Promise<UseAccount<Solana | Near> | undefined> => {
  if (!keypair.privateKey) return;

  // switch (account.type) {
  // let wallet: UseAccount<Solana | Near> | undefined;
  switch (chain) {
    case ChainNetworks.SOL:
      return {
        type: chain,
        account: await getSolanaAccount(keypair.privateKey),
      } as Solana;
    case ChainNetworks.NEAR:
      return {
        type: chain,
        account: await getNearAccount(keypair.privateKey),
      } as Near;
    default:
      throw new Error(`Invalid chain network '${chain}'!`);
  }
};
