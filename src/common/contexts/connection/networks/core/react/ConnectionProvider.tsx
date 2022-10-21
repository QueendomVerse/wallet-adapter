import type { ConnectionConfig } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import type { FC, ReactNode } from "react";
import React, { useMemo } from "react";
import cf from "cross-fetch";
import fetch from "fetch-retry";

import { ConnectionContext } from "./useConnection";

// Attempt at preventing infinite recursions
// https://github.com/solana-labs/solana/issues/24366
const crossRetry = fetch(cf);

export interface ConnectionProviderProps {
  children: ReactNode;
  endpoint: string;
  wsEndpoint?: string;
  config?: ConnectionConfig;
}

export const ConnectionProvider: FC<ConnectionProviderProps> = ({
  children,
  endpoint,
  config = {
    commitment: "confirmed",
    disableRetryOnRateLimit: true,
    fetch: crossRetry,
  },
}) => {
  // const connection = useMemo(() => new Connection(endpoint, config), [endpoint, config]);
  const connection = useMemo(() => {
    console.error("new connection 1", endpoint, config);
    return new Connection(endpoint, config);
  }, [endpoint, config]);

  return (
    <ConnectionContext.Provider value={{ connection }}>
      {children}
    </ConnectionContext.Provider>
  );
};
