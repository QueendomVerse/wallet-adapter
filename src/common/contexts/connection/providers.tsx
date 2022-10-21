import React, { FC, ReactNode } from "react";

import { Adapter, WalletError } from "./networks/core";

import { initializeWallets } from "./networks/core";
import {
  ConnectionProvider as SolanaConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "./networks/solana";
import {
  ConnectionProvider as NearConnectionProvider,
  WalletProvider as NearWalletProvider,
  // BrowserWalletProvider as NearBrowserWalletProvider
} from "./networks/near";

// import {
//   WalletProvider as SampleWalletProvider
// }from './networks/core/react'

interface ConnectionProps {
  children?: React.ReactNode;
}
export const ConnectionProviders: FC<ConnectionProps> = ({
  children,
}: ConnectionProps) => {
  return (
    <SolanaConnectionProvider>
      <NearConnectionProvider>{children}</NearConnectionProvider>
    </SolanaConnectionProvider>
  );
};

interface WalletProps {
  children: ReactNode;
  wallets?: Adapter[];
  autoConnect?: boolean;
  onError?: (error: WalletError) => void;
  localStorageKey?: string;
}

export const WalletProviders: FC<WalletProps> = ({ children }: WalletProps) => {
  return (
    <SolanaWalletProvider wallets={initializeWallets()}>
      <NearWalletProvider>
        {/* <NearBrowserWalletProvider> */}
        {children}
        {/* </NearBrowserWalletProvider> */}
      </NearWalletProvider>
    </SolanaWalletProvider>
  );
};
