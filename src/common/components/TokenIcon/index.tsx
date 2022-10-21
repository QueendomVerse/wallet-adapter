import React from "react";
import { useBetween } from "use-between";
import { PublicKey } from "@solana/web3.js";
import { useConnectionConfig } from "../..";

import { useShareableSelectedTickerState } from "../../contexts/sharedStates";
import { getTokenIcon, KnownTokenMap } from "../../utils";
import { Identicon } from "../Identicon";

export const TokenIcon = ({
  mintAddress,
  size = 20,
  tokenMap,
}: {
  mintAddress?: string | PublicKey;
  size?: number;
  tokenMap?: KnownTokenMap;
}) => {
  const { selectedTicker } = useBetween(useShareableSelectedTickerState);
  // console.warn('func: TokenIcon', selectedTicker);

  let icon: string | undefined = "";
  if (tokenMap) {
    icon = getTokenIcon(tokenMap, mintAddress);
  } else {
    const { tokenMap } = useConnectionConfig(selectedTicker);
    icon = getTokenIcon(tokenMap, mintAddress);
  }

  if (icon) {
    return (
      <img
        alt="Token icon"
        key={icon}
        width={size.toString()}
        height={size.toString()}
        src={icon}
      />
    );
  }
  return <Identicon address={mintAddress} />;
};

export const PoolIcon = (props: { mintA: string; mintB: string }) => {
  return (
    <div>
      <TokenIcon mintAddress={props.mintA} />
      <TokenIcon mintAddress={props.mintB} />
    </div>
  );
};
