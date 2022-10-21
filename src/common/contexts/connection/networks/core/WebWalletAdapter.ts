import { EventEmitter as Emitter } from "eventemitter3";
import {
  // BaseWalletAdapter,
  BaseMessageSignerWalletAdapter,
} from "@solana/wallet-adapter-base";
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  TransactionSignature,
} from "@solana/web3.js";
import bs58 from "bs58";
import getConfig from "next/config";

import {
  // AdapterEvents,
  // BaseMessageSignerWalletAdapter,
  SendTransactionOptions,
  // BaseWalletAdapter,
  WalletAdapterNetwork,
  WalletName,
  WalletReadyState,
  // WalletError,
  // WalletDisconnectedError,
  WalletSendTransactionError,
  WalletDisconnectionError,
  WalletNotConnectedError,
  WalletSelectionError,
  WalletConfigError,
  // WalletNameError,
  // WalletActivationError,
  // WalletNotActivatedError,
  WalletLoadError,
  WalletKeypairError,
  WalletNotReadyError,
  WalletPublicKeyError,
  WalletPrivateKeyError,
  // WalletKeypairError,
  WalletSignTransactionError,
  WalletConnectionError,
} from "./base";

import {
  capitalizeFirst,
  notify,
  asyncEnsureRpcConnection,
} from "../../../../utils";
import { WebWallet } from "./WebWallet";

const { publicRuntimeConfig } = getConfig();

export interface WebWalletAdapterConfig {
  name?: string;
  network?: WalletAdapterNetwork;
  node?: string;
}

interface Notification {
  message: string;
  description: string;
}

// export const WebWalletName = 'WebWallet' as WalletName;

export class WebWalletAdapter extends BaseMessageSignerWalletAdapter {
  private readonly _emitter = new Emitter();

  public name: WalletName;
  public url = publicRuntimeConfig.publicAppSite;
  public icon =
    "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDQ3LjUgNDcuNSIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDcuNSA0Ny41OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgdmVyc2lvbj0iMS4xIiBpZD0ic3ZnMiI+PGRlZnMgaWQ9ImRlZnM2Ij48Y2xpcFBhdGggaWQ9ImNsaXBQYXRoMTYiIGNsaXBQYXRoVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBpZD0icGF0aDE4IiBkPSJNIDAsMzggMzgsMzggMzgsMCAwLDAgMCwzOCBaIi8+PC9jbGlwUGF0aD48L2RlZnM+PGcgdHJhbnNmb3JtPSJtYXRyaXgoMS4yNSwwLDAsLTEuMjUsMCw0Ny41KSIgaWQ9ImcxMCI+PGcgaWQ9ImcxMiI+PGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXBQYXRoMTYpIiBpZD0iZzE0Ij48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzNyw1KSIgaWQ9ImcyMCI+PHBhdGggaWQ9InBhdGgyMiIgc3R5bGU9ImZpbGw6IzNiODhjMztmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZSIgZD0ibSAwLDAgYyAwLC0yLjIwOSAtMS43OTEsLTQgLTQsLTQgbCAtMjgsMCBjIC0yLjIwOSwwIC00LDEuNzkxIC00LDQgbCAwLDI4IGMgMCwyLjIwOSAxLjc5MSw0IDQsNCBsIDI4LDAgYyAyLjIwOSwwIDQsLTEuNzkxIDQsLTQgTCAwLDAgWiIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyNC4wODc5LDE1LjA2OTMpIiBpZD0iZzI0Ij48cGF0aCBpZD0icGF0aDI2IiBzdHlsZT0iZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTpub25lIiBkPSJtIDAsMCBjIDAuNTI2LDEuMTc5IDAuNzQ0LDIuNTQyIDAuNzQ0LDMuOTY5IDAsMy42ODkgLTEuOTU0LDcuMTMxIC01LjgyOSw3LjEzMSAtMy44NzYsMCAtNS44MywtMy4zNzkgLTUuODMsLTcuMTMxIDAsLTMuNzgyIDEuODkyLC03LjEzMiA1LjgzLC03LjEzMiAwLjcxMiwwIDEuMzY0LDAuMDk0IDEuOTgzLDAuMjE4IGwgLTEuMTE1LDEuMDg1IGMgLTAuMzQyLDAuMzEgLTAuNTksMC44MDYgLTAuNTksMS4yNCAwLDEuMjA5IDAuODM4LDIuMjMyIDIuMTA5LDIuMjMyIDAuNDM0LDAgMC44MDUsLTAuMTU1IDEuMTc4LC0wLjQwMyBMIDAsMCBaIG0gMC4zNzEsLTYuMDc3IGMgLTEuNTE5LC0wLjg2OCAtMy4zNDgsLTEuMzY0IC01LjQ1NiwtMS4zNjQgLTYuMjk1LDAgLTEwLjY2Niw0Ljk5MiAtMTAuNjY2LDExLjQxIDAsNi40NDkgNC4zNCwxMS40MSAxMC42NjYsMTEuNDEgNi4yMzEsMCAxMC42NjUsLTUuMTE2IDEwLjY2NSwtMTEuNDEgMCwtMi43MjkgLTAuNzEzLC01LjIwOSAtMi4wNzgsLTcuMTYyIGwgMS43NjgsLTEuNTIgYyAwLjU4OSwtMC41MjcgMS4wODUsLTEuMDIzIDEuMDg1LC0xLjg5MSAwLC0xLjA4NSAtMS4wODUsLTEuOTU0IC0yLjEzOCwtMS45NTQgLTAuNjg0LDAgLTEuMjQsMC4yOCAtMi4wNzgsMC45OTMgbCAtMS43NjgsMS40ODggeiIvPjwvZz48L2c+PC9nPjwvZz4KCQoJPG1ldGFkYXRhPgoJCTxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIgeG1sbnM6cmRmcz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wMS9yZGYtc2NoZW1hIyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIj4KCQkJPHJkZjpEZXNjcmlwdGlvbiBhYm91dD0iaHR0cHM6Ly9pY29uc2NvdXQuY29tL2xlZ2FsI2xpY2Vuc2VzIiBkYzp0aXRsZT0iUSwgQ2hhcmFjdGVycywgQ2hhcmFjdGVyLCBBbHBoYWJldCwgTGV0dGVyIiBkYzpkZXNjcmlwdGlvbj0iUSwgQ2hhcmFjdGVycywgQ2hhcmFjdGVyLCBBbHBoYWJldCwgTGV0dGVyIiBkYzpwdWJsaXNoZXI9Ikljb25zY291dCIgZGM6ZGF0ZT0iMjAxNi0xMi0xNCIgZGM6Zm9ybWF0PSJpbWFnZS9zdmcreG1sIiBkYzpsYW5ndWFnZT0iZW4iPgoJCQkJPGRjOmNyZWF0b3I+CgkJCQkJPHJkZjpCYWc+CgkJCQkJCTxyZGY6bGk+VHdpdHRlciBFbW9qaTwvcmRmOmxpPgoJCQkJCTwvcmRmOkJhZz4KCQkJCTwvZGM6Y3JlYXRvcj4KCQkJPC9yZGY6RGVzY3JpcHRpb24+CgkJPC9yZGY6UkRGPgogICAgPC9tZXRhZGF0YT48L3N2Zz4K";

  private _activeNotification: boolean;
  private _config: WebWalletAdapterConfig;
  private _autoConnect: boolean;
  private _label: string | null;
  private _chain: string | null;
  private _selecting: boolean;
  private _connecting: boolean;
  private _disconnecting: boolean;
  private _keyPair: Keypair | null;
  private _publicKey: PublicKey | null;
  private _secretKey: Uint8Array | null;
  // private _wallet: WebWallet | null;
  private _wallet: WebWallet;
  private _readyState: WalletReadyState;

  constructor(settings: WebWalletAdapterConfig = {}) {
    super();
    this.name = (settings.name ?? "WebWallet") as WalletName;
    console.debug(
      `WebWalletAdapter Instantiated name ${(this.name, settings.name)}`
    );

    this._activeNotification = false;
    this._config = settings;
    this._autoConnect = false;
    this._label = null;
    this._chain = null;
    this._selecting = false;
    this._connecting = false;
    this._disconnecting = false;
    this._keyPair = null;
    this._publicKey = null;
    this._secretKey = null;
    // this._wallet = null;
    this._wallet = new WebWallet({
      name: this.name,
      // network: this.config?.network ?? WalletAdapterNetwork.Devnet,
      network: this.config?.network,
      node: this.config?.network,
    });
    this._readyState =
      typeof window === "undefined"
        ? WalletReadyState.Unsupported
        : WalletReadyState.Loadable;
  }

  private _disconnected = () => {
    const wallet = this._wallet;
    if (wallet) {
      wallet?.emitter.off("disconnect", this._disconnected);

      this._publicKey = null;

      // this.emit('error', new WalletDisconnectedError('Failed to Disconnect'));
      this.emit("disconnect");
    }
  };

  get config(): WebWalletAdapterConfig {
    return this._config;
  }

  get autoConnect(): boolean {
    return this._autoConnect;
  }

  get label(): string | null {
    return this._label;
  }

  get chain(): string | null {
    return this._chain;
  }

  get selecting(): boolean {
    return this._selecting;
  }

  get selected(): boolean {
    return !!this._wallet?.selected;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get connected(): boolean {
    return !!this._wallet?.connected;
  }

  get disconnecting(): boolean {
    return this._disconnecting;
  }

  get disconnected(): boolean {
    return !!this._wallet?.disconnected;
  }

  get keyPair(): Keypair | null {
    return this._keyPair;
  }

  get publicKey(): PublicKey | null {
    return this._keyPair?.publicKey || this._publicKey;
  }

  get secretKey(): Uint8Array | null {
    return this._keyPair?.secretKey || this._secretKey;
  }

  get readyState(): WalletReadyState {
    return this._readyState;
  }

  public displayNotification(notification: Notification) {
    console.debug("firing notification ..");
    if (!this._activeNotification) {
      // console.debug('fired!');
      this._activeNotification = true;
      notify({
        message: notification.message,
        description: notification.description,
      });
    }
  }

  public async setCredentials(
    chain: string,
    label: string,
    privateKey: Uint8Array
  ): Promise<void> {
    if (
      this._readyState !== WalletReadyState.Loadable
      // || this._readyState !== WalletReadyState.Installed
    ) {
      throw new WalletNotReadyError(
        `Web Wallet Adapter(${this.name}) Not Ready!`
      );
    }

    if (!this._config) {
      throw new WalletConfigError(
        `Configuration not defined for Web Wallet Adapter(${this.name})!`
      );
    }

    try {
      if (!this._wallet) {
        this._wallet = new WebWallet({
          network: this.config?.network ?? WalletAdapterNetwork.Devnet,
          name: this.name,
        });
      }

      if (!privateKey) {
        this._connecting = false;
        throw new WalletPrivateKeyError(`No private keys provided!`);
      }
      const keypair = Keypair.fromSecretKey(privateKey);
      if (!keypair) {
        this._connecting = false;
        throw new WalletKeypairError(`Unable to create a keypair!`);
      }
      this._keyPair = keypair;

      this._chain = chain;
      this._label = label;
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    } finally {
      this._connecting = false;
    }

    console.debug("Web Wallet loaded, connected and selected");
  }

  public async connect(
    chain?: string,
    label?: string,
    // privateKey?: string
    privateKey?: Uint8Array
  ): Promise<void> {
    console.debug(
      `WebWalletAdapter(connect)${this.name}: Connecting to '${chain}' wallet ${label}`
    );
    // console.warn('WebWalletAdapter(privateKey): ', privateKey)
    if (this.connected || this.connecting) return;

    if (!chain || !label || !privateKey) {
      console.warn(
        `Parameters not provided: '${chain}' '${label}' '${privateKey}'`
      );
    }

    if (
      this._readyState !== WalletReadyState.Loadable
      // || this._readyState !== WalletReadyState.Installed
    ) {
      throw new WalletNotReadyError(
        `Web Wallet Adapter(${this.name}) Not Ready!`
      );
    }

    if (!this._config) {
      throw new WalletConfigError(
        `Configuration not defined for Web Wallet Adapter(${this.name})!`
      );
    }

    try {
      // if (!this._wallet) {
      //   this._wallet = new WebWallet({
      //     network: this._config.network,
      //     name: this.name
      //   });
      // }
      const wallet = this._wallet;

      this._connecting = true;
      if (!wallet.selected) {
        try {
          console.info("Selecting database webwallet", this.name);
          await wallet.select(this.name);
        } catch (error: any) {
          this._connecting = false;
          throw new WalletSelectionError(
            `Web Wallet Adapter(${wallet.name}) Selection Error: ${error?.message}`
          );
        }
      }

      if (!wallet.connected && this.chain && this.label && this.secretKey) {
        try {
          console.info(
            `connecting to webwallet with adapter secretKey: ${this.name}`
          );
          console.info(
            `params: ${bs58.encode(this.secretKey)}`,
            this.chain,
            this.label
          );
          await wallet.setCredentials(this.chain, this.label, this.secretKey);
          await wallet.connect(chain, label, this.secretKey);
        } catch (error: any) {
          this._connecting = false;
          throw new WalletConnectionError(
            `Unable to establish a connection for wallet (${this.name})!`
          );
        }
      } else if (!wallet.connected && chain && label && privateKey) {
        if (!wallet.loaded) {
          try {
            console.debug("loading the webwallet database");
            await wallet.loadDb();
          } catch (error: any) {
            this._connecting = false;
            throw new WalletLoadError(
              `Web Wallet Adapter(${wallet.name}) Loading Error: ${error?.message}`
            );
          }
        }

        // try {
        //   console.debug(`setting wallet credentials: ${this.name}`);
        //   await wallet.setCredentials(chain, label, privateKey);
        // } catch (error: any) {
        //   this._connecting = false;
        //   throw new WalletConnectionError(
        //     `Unable to establish a connection for wallet (${this.name})!`
        //   );
        // }

        try {
          console.debug(`connecting to webwallet: ${this.name}`);
          await wallet.connect(chain, label, privateKey);
        } catch (error: any) {
          this._connecting = false;
          throw new WalletConnectionError(
            `Unable to establish a connection for wallet (${this.name})!`
          );
        }
      }

      // if (!privateKey) {
      //   this._connecting = false;
      //   throw new WalletPrivateKeyError(`No private keys provided!`);
      // }

      if (!wallet.publicKey) {
        throw new WalletPublicKeyError(
          `No Public key found for Web Wallet Adapter(${wallet.name})!`
        );
      }

      let publicKey: PublicKey;
      try {
        const keyBytes = wallet?.publicKey;
        publicKey = new PublicKey(keyBytes!);
      } catch (error: any) {
        throw new WalletPublicKeyError(
          `Web Wallet Adapter(${wallet.name}) Public Key Error: ${error}`
        );
      }

      if (wallet.connected && wallet.publicKey && label != "primary") {
        const base58 = wallet.publicKey.toBase58();

        const keyToDisplay =
          base58.length > 20
            ? `${base58.substring(0, 7)}.....${base58.substring(
                base58.length - 7,
                base58.length
              )}`
            : base58;
        this.displayNotification({
          message: "Web Wallet Connected",
          description: `${capitalizeFirst(chain ?? "")}: ${keyToDisplay}`,
        });
        console.debug(`Web Wallet connection: ${base58}`);
      }

      //@TODO why disconnect?
      // wallet?.on('disconnect', this._disconnected);
      wallet?.emitter.on("disconnect", this._disconnected);
      this._emitter.on("disconnect", this._disconnected);

      this._wallet = wallet;
      this._publicKey = wallet.publicKey;

      this.emit("connect", publicKey);
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    } finally {
      this._connecting = false;
    }
    console.debug("Web Wallet loaded, connected and selected");
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.disconnected || this.disconnecting) return;

      this._disconnecting = true;
      const wallet = this._wallet;

      if (!wallet) {
        console.error("Disconnect Error: Unable to load the WebWallet");
        this._disconnecting = false;
        return;
      }

      if (wallet.connected) {
        console.debug("Disconnecting Web Wallet ...");
        wallet?.emitter.off("disconnect", this._disconnected);

        this._publicKey = null;

        try {
          await wallet.disconnect();
          this.emit("disconnect");

          // Reset notification display
          this._activeNotification = false;
          this._wallet = wallet;
        } catch (error: any) {
          console.error(`WebWallet Disconnection Error: ${error?.message}`);
          notify({
            message: "WebWallet",
            description: "Wallet disconnection failed!",
            type: "error",
          });
          // this.emit('error', new WalletDisconnectionError(error?.message, error));
        }
      }
    } catch (error: any) {
      this.emit("error", new WalletDisconnectionError(error?.message, error));
    } finally {
      this._disconnecting = false;
    }
    console.info("Web Wallet disconnected");
  }

  public async sendTransaction(
    transaction: Transaction,
    connection: Connection,
    options: SendTransactionOptions = {}
  ): Promise<TransactionSignature> {
    let emit = true;
    try {
      try {
        transaction = await this.prepareTransaction(transaction, connection);

        const { signers, ...sendOptions } = options;
        signers?.length && transaction.partialSign(...signers);

        transaction = await this.signTransaction(transaction);

        const rawTransaction = transaction.serialize();

        // return await (await asyncEnsureRpcConnection(connection)).sendRawTransaction(rawTransaction, sendOptions);
        return "dummy";
      } catch (error: any) {
        // If the error was thrown by `signTransaction`, rethrow it and don't emit a duplicate event
        if (error instanceof WalletSignTransactionError) {
          emit = false;
          throw error;
        }
        throw new WalletSendTransactionError(error?.message, error);
      }
    } catch (error: any) {
      if (emit) {
        this.emit("error", error);
      }
      throw error;
    }
  }

  public async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        return (await wallet?.signTransaction(transaction)) || transaction;
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error);
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }

  public async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        return (
          (await wallet?.signAllTransactions(transactions)) || transactions
        );
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error);
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }

  public async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        return await wallet?.signMessage(message, "utf8");
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error);
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }
}
