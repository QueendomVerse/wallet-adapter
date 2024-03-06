import { NearAdapter } from "../hooks";

export type NearWalletSigner = Pick<NearAdapter, 'publicKey' | 'sendTransaction'>;