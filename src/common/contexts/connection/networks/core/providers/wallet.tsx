import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button, Collapse } from "antd";
import {
  ConnectionProvider,
  WalletProvider as BaseWalletProvider,
} from "@solana/wallet-adapter-react";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  SolletWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import cf from "cross-fetch";
import fetch from "fetch-retry";
import getConfig from "next/config";

import { getAdapterNetwork } from "../setup";
import {
  // Adapter,
  // WalletAdapter,
  WalletError,
  WalletAdapter,
} from "../base";
import { useWallet } from "../../solana";

import { MetaplexModal } from "../../../../../components";
import { notify } from "../../../../../utils";

const { publicRuntimeConfig } = getConfig();
const { Panel } = Collapse;
// Attempt at preventing infinite recursions
// https://github.com/solana-labs/solana/issues/24366
const crossRetry = fetch(cf);

export interface WalletModalContextState {
  visible: boolean;
  setVisible: (open: boolean) => void;
}

export const WalletModalContext = createContext<WalletModalContextState>(
  {} as WalletModalContextState
);

export function useWalletModal(): WalletModalContextState {
  return useContext(WalletModalContext);
}

export const WalletModal: FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { wallets, wallet: selected, select } = useWallet();
  const { visible, setVisible } = useWalletModal();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showWallets, setShowWallets] = useState(false);
  const close = useCallback(() => {
    setVisible(false);
    setShowWallets(false);
  }, [setVisible, setShowWallets]);

  const phatomWallet = useMemo(() => new PhantomWalletAdapter(), []);

  return (
    <MetaplexModal title="Connect Wallet" visible={visible} onCancel={close}>
      <span
        style={{
          color: "rgba(255, 255, 255, 0.75)",
          fontSize: "14px",
          lineHeight: "14px",
          fontFamily: "GraphikWeb",
          letterSpacing: "0.02em",
          marginBottom: 14,
        }}
      >
        RECOMMENDED
      </span>

      <Button
        className="phantom-button metaplex-button"
        onClick={async () => {
          console.info(`PhantomWallet name: ${phatomWallet.name}`);
          await select(phatomWallet.name);
          close();
        }}
      >
        <img src={phatomWallet?.icon} style={{ width: "1.2rem" }} />
        &nbsp;Connect to Phantom
      </Button>
      <Collapse
        ghost
        expandIcon={(panelProps) =>
          panelProps.isActive ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 7.5L10 12.5L5 7.5"
                stroke="white"
                stroke-width="2" // eslint-disable-line
                stroke-linecap="round" // eslint-disable-line
                stroke-linejoin="round" // eslint-disable-line
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 5L12.5 10L7.5 15"
                stroke="white"
                stroke-width="2" // eslint-disable-line
                stroke-linecap="round" // eslint-disable-line
                stroke-linejoin="round" // eslint-disable-line
              />
            </svg>
          )
        }
      >
        <Panel
          header={
            <span
              style={{
                fontWeight: 600,
                fontSize: "16px",
                lineHeight: "16px",
                letterSpacing: "-0.01em",
                color: "rgba(255, 255, 255, 255)",
              }}
            >
              Other Wallets
            </span>
          }
          key="1"
        >
          {wallets.map((wallet, idx) => {
            if (wallet.adapter.name === "Phantom") return null;

            return (
              <Button
                key={idx}
                className="metaplex-button w100"
                style={{
                  marginBottom: 5,
                }}
                onClick={async () => {
                  await select(wallet.adapter.name);
                  close();
                }}
              >
                Connect to {wallet.adapter.name}
              </Button>
            );
          })}
        </Panel>
      </Collapse>
    </MetaplexModal>
  );
};

export const WalletModalProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { publicKey } = useWallet();
  console.info(`loading wallet ... ${publicKey}`);

  const [connected, setConnected] = useState(!!publicKey);
  console.info(`wallet connection state: ${connected}`);

  const [visible, setVisible] = useState(false);
  console.info(`wallet visibility state: ${visible}`);

  // const {setIsWalletConnected} = useBetween(useShareableWalletConnectedState);

  useEffect(() => {
    if (publicKey) {
      const base58 = publicKey.toBase58();
      const keyToDisplay =
        base58.length > 20
          ? `${base58.substring(0, 7)}.....${base58.substring(
              base58.length - 7,
              base58.length
            )}`
          : base58;
      console.error("WalletModalProvider: setting wallet connected");
      // setIsWalletConnected(true);
      notify({
        message: "Wallet update",
        description: "Connected to wallet (A)" + keyToDisplay,
      });
    }
  }, [publicKey]);

  useEffect(() => {
    if (!publicKey && connected) {
      notify({
        message: "Wallet update",
        description: "Disconnected from wallet (A)",
      });
    }
    console.error("WalletModalProvider: setting wallet disconnected");
    // setIsWalletConnected(false);
    setConnected(!!publicKey);
  }, [publicKey, connected, setConnected]);

  return (
    <WalletModalContext.Provider
      value={{
        visible,
        setVisible,
      }}
    >
      {children}
      <WalletModal />
    </WalletModalContext.Provider>
  );
};

export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const network = getAdapterNetwork(publicRuntimeConfig.publicSolanaNetwork);
  const nodeUrl: string = publicRuntimeConfig.publicSolanaRpcHost ?? undefined;
  const nodeWsUri: string | undefined = publicRuntimeConfig.publicSolanaWsHost;
  console.info(
    `wallet.common: rpc network: ${network}, ws network: ${nodeWsUri}`
  );

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => nodeUrl ?? clusterApiUrl(network), [network]);
  console.info(`wallet.web.endpoint: ${endpoint}`);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter({ network }),
    ],
    [network]
  );
  // console.info(`wallets: ${wallets.flat.arguments}`);

  // const wallets = useMemo(
  //   () => [
  //     getPhantomWallet(),
  //     getSolflareWallet(),
  //     // getSlopeWallet(),
  //     // getTorusWallet({
  //     //   options: {
  //     //     // @FIXME: this should be changed for Metaplex, and by each Metaplex storefront
  //     //     clientId:
  //     //       'BOM5Cl7PXgE9Ylq1Z1tqzhpydY0RVr8k90QQ85N7AKI5QGSrr9iDC-3rvmy0K_hF0JfpLMiXoDhta68JwcxS1LQ',
  //     //   },
  //     // }),
  //     getLedgerWallet(),
  //     getSolongWallet(),
  //     getMathWallet(),
  //     getSolletWallet(),
  //   ],
  //   [],
  // );

  const onError = useCallback((error: WalletError) => {
    console.error(error);
    notify({
      message: "Wallet error",
      description: error.message,
    });
  }, []);

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{
        commitment: "confirmed",
        disableRetryOnRateLimit: true,
        fetch: crossRetry,
        wsEndpoint: nodeWsUri,
      }}
    >
      {/*<BaseWalletProvider wallets={wallets} onError={onError} autoConnect={false}> */}
      <BaseWalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </BaseWalletProvider>
    </ConnectionProvider>
  );
};

export type WalletSigner = Pick<WalletAdapter, "publicKey" | "sendTransaction">;
