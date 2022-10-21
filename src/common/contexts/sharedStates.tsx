import { useState } from "react";
import { DEFAULT_TICKER } from "../constants";

// Interfaces

export interface EmailLoginInterface {
  accountPublicKey: string;
  encryptedPrivateKey: string;
  encryptedPassword: string;
}

// States

export const useShareableWalletConnectedState = () => {
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  console.debug(`>>> Setting wallet connection state: ${isWalletConnected}`);
  return {
    isWalletConnected,
    setIsWalletConnected,
  };
};

export const useShareableSelectedTickerState = () => {
  const [selectedTicker, setSelectedTicker] = useState<string>(DEFAULT_TICKER);
  console.debug(`>>> Setting selected ticker state: ${selectedTicker}`);
  return {
    selectedTicker,
    setSelectedTicker,
  };
};
