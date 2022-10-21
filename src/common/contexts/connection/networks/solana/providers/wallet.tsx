/*
 * This is a refactored version of the Blockworks Foundation Mango wallet.
 * For Queendom's use case we needed to remove the clearing of the wallet after disconnect and errors.
 * Original: https://github.com/blockworks-foundation/mango-ui-v3/blob/948ec28c91a83e2c0fe5ed218223661be077201c/components/WalletAdapter/WalletProvider.tsx
 */

//@TODO: This commit's got a lot of goodies; review and apply
// https://github.com/blockworks-foundation/mango-ui-v3/pull/203/files#diff-b6ab9734a066a3d49e523c368e5dabcc6b017999c1f9cffd558a2093b6aa1398R51

import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
// import { SubEvent } from 'sub-events';
import { Button, Collapse } from "antd";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  Wallet,
  // WalletContext,
  // useWallet,
  // WalletProvider as BaseWalletProvider,
  // WalletContextState
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import getConfig from "next/config";

import {
  Adapter,
  SendTransactionOptions,
  WalletName,
  WalletError,
  WalletReadyState,
  WalletDisconnectionError,
  WalletAdapterNotMountedError,
  // WalletNotActivatedError,
  WalletNotConnectedError,
  WalletNotReadyError,
  // WalletPublicKeyError
} from "../../core/base";

import { MetaplexModal } from "../../../../../components";
import { notify } from "../../../../../utils";
import { useLocalStorageStringState } from "../../../../../hooks/useLocalStorageState";

import {
  useWallet,
  WalletContext,
  WalletContextState,
} from "../hooks/useWallet";
import { WebWalletAdapter } from "../../core";
import { BrowserWalletAdapter as NearBrowserWalletAdapter } from "../../near";

const { publicRuntimeConfig } = getConfig();
const { Panel } = Collapse;

interface WalletProviderProps {
  children: ReactNode;
  wallets: Adapter[];
  autoConnect?: boolean;
  onError?: (error: WalletError) => void;
  localStorageKey?: string;
}

export interface ExtendedWallet extends Wallet {
  adapter: Adapter;
  readyState: WalletReadyState;
}

export interface WalletModalContextState {
  visible: boolean;
  setVisible: (open: boolean) => void;
}

export const WalletModalContext = createContext<WalletModalContextState>(
  {} as WalletModalContextState
);

export const useWalletModal = (): WalletModalContextState => {
  return useContext(WalletModalContext);
};

const initialState: {
  wallet: ExtendedWallet | null;
  adapter: Adapter | null;
  publicKey: PublicKey | null;
  connected: boolean;
} = {
  wallet: null,
  adapter: null,
  publicKey: null,
  connected: false,
};

export const WalletModal: FC = () => {
  const {
    wallets,
    // wallet: selected,
    select,
  } = useWallet() as WalletContextState;
  const { visible, setVisible } = useWalletModal();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showWallets, setShowWallets] = useState(false);
  const close = useCallback(() => {
    setVisible(false);
    setShowWallets(false);
  }, [setVisible, setShowWallets]);

  const phatomWalletAdapter = useMemo(() => new PhantomWalletAdapter(), []);
  const nearWalletAdapter = useMemo(() => new NearBrowserWalletAdapter(), []);

  const handleSelection = async (wallet: ExtendedWallet) => {
    const nearAdapter = wallet.adapter as NearBrowserWalletAdapter;
    const name = nearAdapter.name;
    console.info(`Selected wallet: '${name}'`);
    switch (name) {
      case "NearBrowserWallet":
        console.debug("Selecting NearBrowserWallet");
        await select(name);
        await nearAdapter.signIn();
        close();
        return;
      default:
        await select(name);
        close();
        return;
    }
  };

  return (
    <MetaplexModal centered visible={visible} onCancel={close} closable={false}>
      <h4 className="mb-3">
        Pick a wallet to connect to {publicRuntimeConfig.publicAppName}
      </h4>
      <Button
        className="metaplex-button-jumbo d-flex wallet-modal-btn"
        onClick={async () => {
          console.info(
            `Selecting phantomWallet name: ${phatomWalletAdapter.name}`
          );
          await select(phatomWalletAdapter.name);
          close();
        }}
      >
        <img src={phatomWalletAdapter?.icon} style={{ width: "1.2rem" }} />
        &nbsp;Connect to Phantom
      </Button>
      <Button
        className="metaplex-button-jumbo d-flex wallet-modal-btn"
        onClick={async () => {
          console.error(
            `Selecting nearWalletAdapter name: ${nearWalletAdapter.name}`
          );
          await select(nearWalletAdapter.name);
          try {
            console.error(nearWalletAdapter);
            await nearWalletAdapter.signIn();
          } catch (error) {
            if (error instanceof Error) {
              console.error(error.message);
              notify({
                message: "Wallet",
                description: error.message,
                type: "error",
              });
              return;
            } else {
              console.error(error);
              notify({
                message: "Wallet",
                description: "Unknown error while fetching keys for Near",
                type: "error",
              });
            }
          }
          close();
        }}
      >
        <img src={nearWalletAdapter?.icon} style={{ width: "1.2rem" }} />
        &nbsp;Connect to Near
      </Button>
      <Collapse
        ghost
        expandIcon={(panelProps) =>
          panelProps.isActive ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="gray"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 7.5L10 12.5L5 7.5"
                stroke="gray"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="gray"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 5L12.5 10L7.5 15"
                stroke="gray"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )
        }
      >
        <Panel header={<strong className="ms-4">Other Wallet</strong>} key="1">
          {wallets.map((wallet, idx) => {
            if (wallet.adapter === phatomWalletAdapter) return null;

            return (
              <Button
                key={idx}
                className="metaplex-button wallet-modal-btn"
                style={{
                  marginBottom: 5,
                }}
                // onClick={() => {
                //   console.info(`Selected wallet: '${wallet.adapter.name}'`)
                //   // wallet.adapter.select()
                //   select(wallet.adapter.name);
                //   close();
                // }}
                onClick={async () => await handleSelection(wallet)}
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
  // const { wallet, connected, disconnect, publicKey } = useWallet();
  const { wallet, publicKey, disconnect } = useWallet();

  const [isWalletConnected, setIsWalletConnected] = useState(!!publicKey);
  const [connected, setConnected] = useState(!!publicKey);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!wallet || wallet?.adapter.name.includes("WebWallet")) {
      console.debug("Excluding Web Wallets ...");
      return;
    }
    if (publicKey) {
      const base58 = publicKey.toBase58();
      const keyToDisplay =
        base58.length > 20
          ? `${base58.substring(0, 7)}.....${base58.substring(
              base58.length - 7,
              base58.length
            )}`
          : base58;
      notify({
        message: `Connected: ${wallet.adapter.name}`,
        description: <h5 className="fw-bold">{keyToDisplay}</h5>,
      });
    }
  }, [wallet, publicKey]);

  useEffect(() => {
    const init = async () => {
      if (!publicKey && connected) {
        try {
          await disconnect();
        } catch (error) {
          console.error("failed to disconnect", error);
          notify({
            message: `Disconnect`,
            description: "Failed",
            type: "error",
          });
        }
        console.info(`Disconnected from ${wallet?.adapter.name}`);
        if (wallet?.adapter.name === "SolanaPrimaryWebWallet") return;
        notify({
          message: `Disconnected`,
          description: "",
        });
      }
      setIsWalletConnected(!!publicKey);
    };
    init();
  }, [publicKey, connected, isWalletConnected]);

  useEffect(() => {
    if (!publicKey && connected) {
      console.info(`Disconnected from ${wallet?.adapter.name}`);
      if (wallet?.adapter.name === "SolanaPrimaryWebWallet") return;
      notify({
        message: `Disconnected`,
        description: "",
      });
      setConnected(false);
    }
    // setIsWalletConnected(!!publicKey);
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

export const WalletProvider: FC<WalletProviderProps> = ({
  children,
  wallets: adapters,
  autoConnect = false,
  onError,
  localStorageKey = "walletName",
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [localName, setLocalName] = useLocalStorageStringState(
    localStorageKey,
    null
  );

  const [{ wallet, adapter, publicKey, connected }, setState] =
    useState(initialState);
  const readyState = adapter?.readyState || WalletReadyState.Unsupported;
  const [connecting, setConnecting] = useState(false);
  const [name, setName] = useState<WalletName | null>(
    (localName ?? "") as WalletName
  );
  const [disconnecting, setDisconnecting] = useState(false);
  const isConnecting = useRef(false);
  const isDisconnecting = useRef(false);
  const isUnloading = useRef(false);

  useMemo(() => {}, [wallet, adapter, publicKey, connected]);

  // Wrap adapters to conform to the `Wallet` interface
  const [wallets, setWallets] = useState(() =>
    adapters
      ? adapters.map((adapter) => ({
          adapter,
          readyState: adapter.readyState,
        }))
      : []
  );

  // When the wallets change, start to listen for changes to their `readyState`
  useEffect(() => {
    if (!adapters || adapters.length < 1) return;

    function handleReadyStateChange(
      this: Adapter,
      readyState: WalletReadyState
    ) {
      setWallets((prevWallets) => {
        const walletIndex = prevWallets.findIndex(
          ({ adapter }) => adapter.name === this.name
        );
        if (walletIndex === -1) return prevWallets;

        return [
          ...prevWallets.slice(0, walletIndex),
          { ...prevWallets[walletIndex], readyState },
          ...prevWallets.slice(walletIndex + 1),
        ];
      });
    }
    //@ts-ignore
    // adapters.forEach(a => a.on('readyStateChange', handleReadyStateChange, adapter))
    // adapters.forEach(adptr=> {
    //   console.info('readyStateChange')
    //   @ts-ignore
    //   adptr.on('readyStateChange', handleReadyStateChange, adptr)
    // })
    for (const adapter of adapters) {
      console.info("handleReadyStateChange");
      adapter.on("readyStateChange", handleReadyStateChange, adapter);
    }
    //@ts-ignore
    // return adapters.forEach(adptr => adptr.off('readyStateChange', handleReadyStateChange, adptr))
    return () => {
      // adapters.forEach(a => a.off('readyStateChange', handleReadyStateChange, adapter))
      for (const adapter of adapters) {
        adapter.off("readyStateChange", handleReadyStateChange, adapter);
      }
    };
  }, [adapters]);

  // When the selected wallet changes, initialize the state
  useEffect(() => {
    if (!wallets || wallets.length < 1) {
      return;
    }
    if (!name) {
      return;
      // console.info("Wallet adapter name is not defined, defaulting to 'WebWallet'");
      // const wallet = wallets.find(({ adapter }) => adapter.name === 'WebWallet');
      // if (!wallet) {
      //   handleError(new WalletNotActivatedError('WebWallet is Not Activated!'));
      //   return;
      // }

      // setState({
      //   wallet,
      //   adapter: wallet.adapter,
      //   connected: wallet.adapter.connected,
      //   publicKey: wallet.adapter.publicKey,
      // });
      // return;
    }
    const wallet = wallets.find(({ adapter }: { adapter: Adapter }) => {
      console.debug(`${adapter.name}, ${name}`);
      return adapter.name === name;
    });
    if (wallet) {
      setState({
        wallet,
        adapter: wallet.adapter,
        connected: wallet.adapter.connected,
        publicKey: wallet.adapter.publicKey,
      });
    } else {
      setState(initialState);
    }
  }, [name, wallets]);

  // If autoConnect is enabled, try to connect when the adapter changes and is ready
  useEffect(() => {
    if (
      isConnecting.current ||
      connecting ||
      connected ||
      !autoConnect ||
      !adapter ||
      !(
        readyState === WalletReadyState.Installed ||
        readyState === WalletReadyState.Loadable
      )
    )
      return;

    if (!publicKey) return;
    (async function () {
      isConnecting.current = true;
      setConnecting(true);
      try {
        //@TODO add chain, secretkey pubkey label
        await adapter.connect(
          //@ts-ignore
          adapter?.chain,
          //@ts-ignore
          adapter?.label,
          //@ts-ignore
          adapter?.secretKey
        );
      } catch (error: any) {
        // Clear the selected wallet
        setName(null);
        // Don't throw error, but handleError will still be called
      } finally {
        setConnecting(false);
        isConnecting.current = false;
      }
    })();
  }, [
    isConnecting,
    connecting,
    publicKey,
    connected,
    autoConnect,
    adapter,
    wallet,
    readyState,
  ]);

  // If the window is closing or reloading, ignore disconnect and error events from the adapter
  useEffect(() => {
    function listener() {
      isUnloading.current = true;
    }

    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, [isUnloading]);

  // Handle the adapter's select event
  //@TODO handle name only?
  const handleSelect = useCallback(() => {
    if (!adapter) {
      return handleError(
        new WalletAdapterNotMountedError(`Wallet Adapter Not Mounted`)
      );
    }
    setState((state) => ({
      ...state,
      // selected: adapter.selected,
      name: adapter.name,
    }));
  }, [adapter]);

  // Handle the adapter's connect event
  const handleConnect = useCallback(() => {
    if (!adapter) {
      return handleError(
        new WalletAdapterNotMountedError(`Wallet Adapter Not Mounted`)
      );
    }
    setState((state) => ({
      ...state,
      connected: adapter.connected,
      publicKey: adapter.publicKey,
    }));
  }, [adapter, wallet]);

  // Handle the adapter's disconnect event
  const handleDisconnect = useCallback(() => {
    if (!adapter) {
      handleError(
        new WalletAdapterNotMountedError(`Wallet Adapter Not Mounted`)
      );
      return;
    }
    if (!isUnloading.current) setName(null);
    // setState(state => ({
    //   ...state,
    //   connected: false,
    //   publicKey: null,
    // }));
  }, [adapter]);

  // Handle the adapter's error event, and local errors
  const handleError = useCallback(
    (error: WalletError) => {
      // Call onError unless the window is unloading
      if (!isUnloading.current) (onError || console.error)(error);
      notify({
        message: "Wallet Error",
        description: error.message,
      });
      return error;
    },
    [isUnloading, onError]
  );

  // Setup and teardown event listeners when the adapter changes
  useEffect(() => {
    if (adapter) {
      adapter.on("connect", handleConnect);
      adapter.on("disconnect", handleDisconnect);
      adapter.on("error", handleError);
      return () => {
        adapter.off("connect", handleConnect);
        adapter.off("disconnect", handleDisconnect);
        adapter.off("error", handleError);
      };
    }
  }, [adapter, handleSelect, handleConnect, handleDisconnect, handleError]);

  // When the adapter changes, disconnect the old one
  useEffect(() => {
    if (!adapter) return;
    const init = async () => {
      try {
        return await adapter.disconnect();
      } catch (error) {
        return handleError(
          new WalletDisconnectionError(
            `Failed to Disconnect Wallet(${name}) Adapter!`
          )
        );
      }
    };
    init();
  }, [adapter]);

  const select = useCallback(
    async (name: WalletName) => {
      setName(name);
    },
    [adapter]
  );

  const setCredentials = useCallback(
    async (chain: string, label: string, privateKey: Uint8Array) => {
      if (!adapter) {
        handleError(
          new WalletAdapterNotMountedError(
            `Wallet(${name}) Adapter Not Mounted!`
          )
        );
        return;
      }

      if (adapter.name.includes("WebWallet")) {
        const webWalletAdapter = adapter as WebWalletAdapter;
        webWalletAdapter.setCredentials(chain, label, privateKey);
      }
    },
    [name, adapter]
  );

  // Connect the adapter to the wallet
  const connect = useCallback(
    async (
      chain?: string,
      label?: string,
      privateKey?: Uint8Array,
      force?: boolean,
      wltName?: WalletName
    ) => {
      if (force && wltName && adapter) {
        setName(wltName);
        return await adapter.connect(chain, label, privateKey);
      }

      // if (!force && (isConnecting.current || connecting || disconnecting || connected)) {
      if (isConnecting.current || connecting || disconnecting || connected) {
        console.warn(`Wallet is currently connecting or is already connected`);
        return;
      }
      if (!adapter) {
        handleError(
          new WalletAdapterNotMountedError(
            `Wallet(${name}) Adapter Not Mounted!`
          )
        );
        return;
      }

      console.error(
        "meh?",
        !adapter.name.includes("WebWallet"),
        readyState === WalletReadyState.Installed,
        readyState === WalletReadyState.Loadable
      );

      if (
        !adapter.name.includes("WebWallet") &&
        !(
          readyState === WalletReadyState.Installed ||
          readyState === WalletReadyState.Loadable
        )
      ) {
        if (typeof window !== "undefined") {
          window.open(adapter.url, "_blank");
        }
        handleError(
          new WalletNotReadyError(`Wallet(${adapter.name}) not ready!`)
        );
        return;
      }
      // if (!publicKey) {
      //   return handleError(new WalletPublicKeyError(
      //     `Wallet(${adapter.name}) does not have a public key!`
      //   ));
      // }

      isConnecting.current = true;
      setConnecting(true);
      try {
        await adapter.connect(chain, label, privateKey);
      } catch (error: any) {
        disconnect();
        setName(null);
      }
      setConnecting(false);
      isConnecting.current = false;
    },
    [
      isConnecting,
      connecting,
      disconnecting,
      connected,
      adapter,
      name,
      wallet,
      readyState,
      handleError,
    ]
  );

  // Disconnect the adapter from the wallet
  const disconnect = useCallback(async () => {
    if (isDisconnecting.current || disconnecting) return;
    // if (!adapter) {
    //   handleError(new WalletAdapterNotMountedError(`Wallet Adapter Not Mounted`));
    //   return;
    // }
    if (!adapter) return setName(null);

    isDisconnecting.current = true;
    setDisconnecting(true);
    try {
      await adapter.disconnect();
      setDisconnecting(false);
    } catch (error: any) {
      setName(null);
      // throw error;
      handleError(new WalletError(`Unknown Error: ${error}`));
    } finally {
      setDisconnecting(false);
      isDisconnecting.current = false;
    }
  }, [isDisconnecting, disconnecting, adapter, name]);

  // Send a transaction using the provided connection
  const sendTransaction = useCallback(
    async (
      transaction: Transaction,
      connection: Connection,
      options?: SendTransactionOptions
    ) => {
      if (!adapter) {
        throw handleError(
          new WalletAdapterNotMountedError(`Wallet Adapter Not Mounted`)
        );
      }
      if (!connected) {
        throw handleError(
          new WalletNotConnectedError(
            `Wallet(${adapter.name}) 1 not connected!`
          )
        );
      }
      return await adapter.sendTransaction(transaction, connection, options);
    },
    [adapter, handleError, connected]
  );

  // Sign a transaction if the wallet supports it
  // const signTransaction = useMemo(async() => {
  //   if (!adapter) {
  //     return handleError(new WalletAdapterNotMountedError(`Wallet Adapter Not Mounted`));
  //   }
  //   if (!connected) {
  //     return handleError(new WalletNotConnectedError(`Wallet(${adapter.name}) 2 not connected!`));
  //   }
  //   if ( adapter && 'signTransaction' in adapter) {
  //     const sign = async (transaction: Transaction): Promise<Transaction> => {
  //       return await adapter.signTransaction(transaction);
  //     }
  //     await sign();
  //   }
  // }, [adapter, handleError, connected])
  const signTransaction = useMemo(
    () =>
      adapter && "signTransaction" in adapter
        ? async (transaction: Transaction): Promise<Transaction> => {
            if (!connected) {
              throw handleError(
                new WalletNotConnectedError(
                  `Wallet(${adapter.name}) 2 not connected!`
                )
              );
            }
            return await adapter.signTransaction(transaction);
          }
        : undefined,
    [adapter, handleError, connected]
  );

  // Sign multiple transactions if the wallet supports it
  const signAllTransactions = useMemo(
    () =>
      adapter && "signAllTransactions" in adapter
        ? async (transactions: Transaction[]): Promise<Transaction[]> => {
            if (!connected) {
              throw handleError(
                new WalletNotConnectedError(
                  `Wallet(${adapter.name}) 3 not connected!`
                )
              );
            }
            return await adapter.signAllTransactions(transactions);
          }
        : undefined,
    [adapter, handleError, connected]
  );

  // Sign an arbitrary message if the wallet supports it
  const signMessage = useMemo(
    () =>
      adapter && "signMessage" in adapter
        ? async (message: Uint8Array): Promise<Uint8Array> => {
            if (!connected) {
              throw handleError(
                new WalletNotConnectedError(
                  `Wallet(${adapter.name}) 4 not connected!`
                )
              );
            }
            return await adapter.signMessage(message);
          }
        : undefined,
    [adapter, handleError, connected]
  );

  return (
    <WalletContext.Provider
      value={{
        autoConnect,
        wallets,
        wallet,
        publicKey,
        connected,
        connecting,
        disconnecting,
        setCredentials,
        select,
        connect,
        disconnect,
        sendTransaction,
        signTransaction,
        signAllTransactions,
        signMessage,
      }}
    >
      <WalletModalProvider>{children}</WalletModalProvider>
    </WalletContext.Provider>
  );
};

export type WalletSigner = Pick<Adapter, "publicKey" | "sendTransaction">;
