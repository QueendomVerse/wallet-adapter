import { PublicKey } from "@solana/web3.js";
import { useBetween } from "use-between";

import { useConnectionConfig } from "..";

import { getTokenName } from "../utils/utils";
import { useShareableSelectedTickerState } from "../contexts/sharedStates";

export function useTokenName(mintAddress?: string | PublicKey) {
  const { selectedTicker } = useBetween(useShareableSelectedTickerState);

  const { tokenMap } = useConnectionConfig(selectedTicker);
  const address =
    typeof mintAddress === "string" ? mintAddress : mintAddress?.toBase58();
  return getTokenName(tokenMap, address);
}
