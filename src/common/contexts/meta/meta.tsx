import { merge, uniqWith } from "lodash";
import React, { ReactNode, useContext, useEffect, useState } from "react";
import { useBetween } from "use-between";

import { useConnection } from "../..";
import { useWallet } from "../../contexts/connection/networks/solana";

import { useStore } from "../store";
import { getEmptyMetaState } from "./getEmptyMetaState";
import { loadAccounts } from "./loadAccounts";
// import { loadAccountsNoWallet } from './loadAccountsNoWallet';
import { ParsedAccount } from "../accounts/types";
import { Metadata } from "../../actions";
import { MetaContextState, MetaState } from "./types";
import { useShareableSelectedTickerState } from "../../contexts/sharedStates";
// import { boolean } from '@hapi/joi';

const MetaContext = React.createContext<MetaContextState>({
  ...getEmptyMetaState(),
  isLoading: false,
  setIsLoading: () => false,
  patchState: () => {
    throw new Error("unreachable");
  },
});

export function MetaProvider({ children = null }: { children: ReactNode }) {
  const { selectedTicker } = useBetween(useShareableSelectedTickerState);
  const connection = useConnection(selectedTicker);
  const { isReady, storeAddress, ownerAddress } = useStore();
  // const { publicKey } = useWallet();

  const [state, setState] = useState<MetaState>(getEmptyMetaState());

  const [isLoading, setIsLoading] = useState(true);

  const patchState: MetaContextState["patchState"] = (
    ...args: Partial<MetaState>[]
  ) => {
    setState((current) => {
      const newState = merge({}, current, ...args, { store: current.store });

      const currentMetdata = current.metadata ?? [];
      const nextMetadata = args.reduce((memo, { metadata = [] }) => {
        return [...memo, ...metadata];
      }, [] as ParsedAccount<Metadata>[]);

      newState.metadata = uniqWith(
        [...currentMetdata, ...nextMetadata],
        (a, b) => a?.pubkey === b?.pubkey
      );

      return newState;
    });
  };

  useEffect(() => {
    (async () => {
      if (!storeAddress || !ownerAddress) {
        // if (isReady) {
        //   setIsLoading(false);
        // }
        return isReady ? setIsLoading(false) : setIsLoading(true);
      } else if (!state.store) {
        setIsLoading(true);
      }

      if (!connection) return setIsLoading(false);
      const nextState = await loadAccounts(connection, ownerAddress);
      setState(nextState);

      setIsLoading(false);
    })();
  }, [connection, storeAddress, isReady, ownerAddress]);

  return (
    <MetaContext.Provider
      value={{
        ...state,
        patchState,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </MetaContext.Provider>
  );
}

export const useMeta = () => {
  const context = useContext(MetaContext);
  return context;
};
