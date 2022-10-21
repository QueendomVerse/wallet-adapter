// export * from './base';
// export { initializeWallets } from './base';
export {
  BaseWalletAdapter,
  // WalletAdapter,
  // type WalletName,
  // type WalletReadyState
} from "./base/adapter";
export * from "./base/errors";
export * from "./base/signer";
export * from "./base/types";

export * from "./setup";
export * from "./providers";
export * from "./WebWallet";
export * from "./WebWalletAdapter";
