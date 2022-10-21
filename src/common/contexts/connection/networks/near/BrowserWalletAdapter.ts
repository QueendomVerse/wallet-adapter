import { EventEmitter as Emitter } from "eventemitter3";
import {
  Transaction as SolanaTransaction,
  PublicKey as SolanaPublicKey,
} from "@solana/web3.js";
import { Contract, ConnectedWalletAccount } from "near-api-js";
import { Transaction as NearTransaction } from "near-api-js/lib/transaction";
// import { PublicKey as NearPublicKey } from 'near-api-js/lib/utils';
// import { Connection } from 'near-api-js/lib/connection';
import getConfig from "next/config";

import {
  WalletAdapterNetwork,
  BaseMessageSignerWalletAdapter,
} from "../core/base";
import { WalletName, WalletReadyState } from "../core/base/adapter";
// import {
//   // BaseMessageSignerWalletAdapter
// } from '../base/signer';

import { BrowserWallet, Gas } from "./BrowserWallet";
import {
  WalletDisconnectedError,
  WalletDisconnectionError,
  WalletConfigError,
  WalletSelectionError,
  WalletConnectionError,
  WalletActivationError,
  WalletNotActivatedError,
  WalletNotReadyError,
  WalletPublicKeyError,
  WalletKeypairError,
  WalletSignTransactionError,
  WalletAccountError,
} from "../core";
import { notify, capitalizeFirst } from "../../../../utils";

// import { BaseMessageSignerWalletAdapter } from '../../../utils/wallets/base';
// import { NearIcon } from './view/icon/near';
// import { NearBox } from '../../../components/Custom';
// import NearBoxSvg from '../../../components/svgs/near-box';

const { publicRuntimeConfig } = getConfig();

const GAS_CALC_CONTRACT_ID = "guest-book.testnet";

export interface BrowserWalletAdapterConfig {
  name?: string;
  network?: WalletAdapterNetwork;
}

interface Notification {
  message: string;
  description: string;
}

export const walletName = "NearBrowserWallet" as WalletName;

export class BrowserWalletAdapter extends BaseMessageSignerWalletAdapter {
  private readonly _emitter = new Emitter();

  public name: WalletName;
  public url = publicRuntimeConfig.publicAppSite;
  public icon =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI0LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA5MC4xIDkwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA5MC4xIDkwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxwYXRoIGQ9Ik03Mi4yLDQuNkw1My40LDMyLjVjLTEuMywxLjksMS4yLDQuMiwzLDIuNkw3NC45LDE5YzAuNS0wLjQsMS4yLTAuMSwxLjIsMC42djUwLjNjMCwwLjctMC45LDEtMS4zLDAuNWwtNTYtNjcKCUMxNywxLjIsMTQuNCwwLDExLjUsMGgtMkM0LjMsMCwwLDQuMywwLDkuNnY3MC44QzAsODUuNyw0LjMsOTAsOS42LDkwYzMuMywwLDYuNC0xLjcsOC4yLTQuNmwxOC44LTI3LjljMS4zLTEuOS0xLjItNC4yLTMtMi42CglsLTE4LjUsMTZjLTAuNSwwLjQtMS4yLDAuMS0xLjItMC42VjIwLjFjMC0wLjcsMC45LTEsMS4zLTAuNWw1Niw2N2MxLjgsMi4yLDQuNSwzLjQsNy4zLDMuNGgyYzUuMywwLDkuNi00LjMsOS42LTkuNlY5LjYKCWMwLTUuMy00LjMtOS42LTkuNi05LjZDNzcuMSwwLDc0LDEuNyw3Mi4yLDQuNnoiLz4KPC9zdmc+Cg==";

  private _activeNotification: boolean;
  private _autoConnect: boolean;
  private _config: BrowserWalletAdapterConfig;
  private _connecting: boolean;
  private _disconnecting: boolean;
  private _wallet: BrowserWallet | null;
  private _publicKey: SolanaPublicKey | undefined;
  private _secretKey: Uint8Array | null;
  private _selecting: boolean;
  private _readyState: WalletReadyState =
    typeof window === "undefined"
      ? WalletReadyState.Unsupported
      : WalletReadyState.Loadable;

  constructor(config: BrowserWalletAdapterConfig = {}) {
    super();
    this.name = (config.name ?? "NearBrowserWallet") as WalletName;
    this._activeNotification = false;
    this._autoConnect = false;
    this._connecting = false;
    this._config = config;
    this._disconnecting = false;
    this._publicKey = undefined;
    this._secretKey = null;
    this._selecting = false;
    this._wallet = null;
  }

  private _disconnected = () => {
    const wallet = this._wallet;
    if (wallet) {
      wallet?.emitter.off("disconnect", this._disconnected);

      this._publicKey = undefined;

      this.emit(
        "error",
        new WalletDisconnectedError("Unable to Disconnect Near Browser Wallet!")
      );
      this.emit("disconnect");
    }
  };

  get autoConnect(): boolean {
    return this._autoConnect;
  }

  get publicKey(): SolanaPublicKey | null {
    const pubKeyStr = this._publicKey?.toBase58();
    if (!pubKeyStr) return null;
    return new SolanaPublicKey(pubKeyStr);
  }

  get secretKey(): Uint8Array | null {
    return this._secretKey;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get disconnecting(): boolean {
    return this._disconnecting;
  }

  get connected(): boolean {
    return !!this._wallet?.connected;
  }

  get disconnected(): boolean {
    return !!this._wallet?.disconnected;
  }

  get readyState(): WalletReadyState {
    return this._readyState;
  }

  get selected(): boolean {
    return !!this._wallet?.selected;
  }

  get selecting(): boolean {
    return this._selecting;
  }

  get config(): BrowserWalletAdapterConfig {
    if (!this._config) {
      throw new WalletConfigError(
        `Configuration not defined for Near Browser Wallet!`
      );
    }
    return this._config;
  }

  get account(): ConnectedWalletAccount | undefined {
    if (!this._wallet?.account) {
      throw new WalletAccountError(
        `Account not found for Near Browser Wallet!`
      );
    }
    return this._wallet.account;
  }

  get accountId(): string | undefined {
    if (!this._wallet?.accountId) {
      throw new WalletAccountError(
        `Account not found for Near Browser Wallet!`
      );
    }
    return this._wallet.accountId;
  }

  get contract(): Contract | undefined {
    return this._wallet?.contract;
  }

  displayNotification(notification: Notification) {
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

  testConfig = {
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
    // contractName: "nft01.0xchai.testnet",
    contractName: "nft-contract.circlenaut.testnet",
    walletUrl: "https://wallet.testnet.near.org",
    helperUrl: "https://helper.testnet.near.org",
    headers: { "Content-Type": "application/json" },
  };

  async signIn() {
    console.info("Invoking Near Browser Wallet login.");
    // if (!this.publicKey) return;
    if (!this.connected)
      await this
        .connect
        // new SolanaPublicKey(this.publicKey.toBase58())
        ();
    return this._wallet?.signIn();
  }

  // setPublicKey(data: Uint8Array) {
  setPublicKey(key: string) {
    console.error("adapter pubKey", key);
    console.error("this._wallet", this.connected);
    console.dir(this._wallet);

    this._wallet?.setPublicKey(key);
    const pubKey = this._wallet?.publicKey;
    if (!pubKey) {
      console.warn("Near Browser Wallet: Public key not set!");
      return;
    }
    // this._publicKey = this._wallet?.publicKey;
    this._publicKey = new SolanaPublicKey(pubKey.toBase58());
    console.error("adapter this._publicKey", this._publicKey);
    // this._publicKey = this._wallet?.publicKey();
    if (!this._publicKey) {
      throw new WalletPublicKeyError(
        "Near Browser Wallet: Public key not found!"
      );
    }

    this.emit("connect", this._publicKey);
  }

  async connect(
    chain?: string,
    label?: string,
    privateKey?: Uint8Array
  ): Promise<void> {
    console.error("Near Browser Wallet(privateKey): ", privateKey);
    // this._publicKey = publicKey;
    console.error("Near Browser Wallet Connecting ...");
    try {
      if (this.connected || this.connecting) {
        console.warn("Near Browser Wallet already connected!");
        return;
      }
      if (this._readyState !== WalletReadyState.Loadable)
        throw new WalletNotReadyError("Near Browser Wallet Not Ready!");

      if (!this._wallet) {
        this._wallet = new BrowserWallet({ ...this.testConfig });
      }

      this._connecting = true;

      const wallet = this._wallet;
      if (!wallet)
        throw new WalletNotActivatedError("Near Browser Wallet Not Activated!");

      if (!wallet.connected) {
        try {
          console.debug(
            `connecting to Near Browser Wallet: ${wallet.publicKey}`
          );
          await wallet.connect();
        } catch (error: any) {
          throw new WalletConnectionError(
            `Near Browser Wallet Connection Error: ${error?.message}`
          );
        }
      }

      // if (!wallet.selected && chain && privateKey) {
      if (!wallet.selected) {
        try {
          console.debug("Selecting near browser wallet");
          await this.select(this.name); // @philli
          // await this.select(this.name, chain, privateKey); // @phillip: Never a good reason for this to be true
        } catch (error: any) {
          throw new WalletSelectionError(
            `Near Browser Wallet Selection Error: ${error?.message}`
          );
        }
      }

      if (!wallet.isSignedIn()) return await wallet.signIn();

      if (!wallet?.publicKey) {
        throw new WalletKeypairError(
          "No Keypairs Found for the Near Browser Wallet!"
        );
      }

      let publicKey: SolanaPublicKey;
      try {
        const keyBytes = wallet?.publicKey;
        publicKey = new SolanaPublicKey(keyBytes!);
      } catch (error: any) {
        throw new WalletPublicKeyError(
          `Near Browser Wallet Public Key Error: ${error}`
        );
      }

      // if (this._wallet.connected && this._wallet.publicKey) {
      if (this._wallet.connected && this._publicKey) {
        console.debug(`Near Browser Wallet connected: ${this.name}`);
        // const base58 = this._wallet.publicKey;
        const base58 = this._publicKey.toBase58();

        const keyToDisplay =
          base58.length > 20
            ? `${base58.substring(0, 7)}.....${base58.substring(
                base58.length - 7,
                base58.length
              )}`
            : base58;
        this.displayNotification({
          message: "Near Browser Wallet Connected",
          description: `${capitalizeFirst(chain ?? "")}: ${keyToDisplay}`,
        });
        console.debug(`Near Browser Wallet connection: ${base58}`);
      }

      //@TODO why disconnect?
      // wallet?.on('disconnect', this._disconnected);
      wallet?.emitter.on("disconnect", this._disconnected);
      this._emitter.on("disconnect", this._disconnected);

      this._wallet = wallet;
      this._publicKey = publicKey;

      this.emit("connect", publicKey!);
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    } finally {
      this._connecting = false;
    }

    console.debug("Near Browser Wallet loaded, connected and selected");
  }

  async disconnect(): Promise<void> {
    try {
      if (this.disconnected || this.disconnecting) {
        console.warn("Near Browser Wallet already disconnected!");
        return;
      }

      this._disconnecting = true;
      const wallet = this._wallet;

      if (!wallet) {
        return;
        // throw new WalletActivationError(
        //   'Disconnect Error: Unable to activate the Near Browser Wallet'
        // );
      }

      if (wallet.connected) {
        console.debug("Disconnecting Near Browser Wallet ...");
        wallet?.emitter.off("disconnect", this._disconnected);

        this._publicKey = undefined;

        try {
          await wallet.disconnect();
          this.emit("disconnect");

          // Reset notification display
          this._activeNotification = false;
          this._wallet = wallet;
        } catch (error: any) {
          throw new WalletDisconnectionError(
            `Near Browser Wallet Disconnect Error: ${error?.message}`
          );
        }
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    } finally {
      this._disconnecting = false;
    }
    console.info("Near Browser Wallet disconnected");
  }

  async select(
    walletName: WalletName,
    // chain?: string,
    // privateKey?: Uint8Array,
    login?: boolean
    // force?: boolean,
  ): Promise<void> {
    console.error("Starting selection ...");
    try {
      if (this._readyState !== WalletReadyState.Loadable)
        throw new WalletNotReadyError("Near Browser Wallet Not Ready!");

      this._selecting = true;

      const wallet = this._wallet;
      if (!wallet)
        throw new WalletNotActivatedError("Near Browser Wallet Not Activated!");

      // if (!wallet.connected) {
      //   console.error('Selection Error: Wallet is not connected');
      //   return;
      // }

      // if (!wallet.selected && chain && privateKey) {
      console.error("login", login);
      if (!wallet.selected && login) {
        try {
          console.debug("Selecting near browser wallet");
          // await wallet.signIn();
          // await wallet.selectWallet(chain, privateKey, force); // @phillip: Never a good reason for this to be true
        } catch (error: any) {
          throw new WalletSelectionError(
            `Near Browser Wallet Selection Error: ${error?.message}`
          );
        }
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    } finally {
      this._selecting = false;
    }
    console.info("Near Browser Wallet selected");
  }

  async signTransaction(
    transaction: SolanaTransaction
  ): Promise<SolanaTransaction> {
    try {
      const wallet = this._wallet;
      if (!wallet)
        throw new WalletNotActivatedError("Near Browser Wallet Not Activated!");
      await wallet?.signTransaction(transaction);

      // const nearTx = new NearTransaction(transaction)
      // await wallet?.signTransaction(nearTx)

      try {
        // return () || transaction;
        return transaction;
      } catch (error: any) {
        throw new WalletSignTransactionError(
          `Near Browswer Wallet Transaction Signing Error: ${error}`
        );
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }

  async signAllTransactions(
    transactions: SolanaTransaction[]
  ): Promise<SolanaTransaction[]> {
    // ): Promise<void> {
    try {
      const wallet = this._wallet;
      if (!wallet)
        throw new WalletNotActivatedError("Near Browser Wallet Not Activated!");

      const nearTxs = transactions.map((t) => new NearTransaction(t));

      await wallet?.signAllTransactions(nearTxs);

      try {
        return transactions;
      } catch (error: any) {
        throw new WalletSignTransactionError(
          `Near Browswer Wallet Transaction Signing Error: ${error}`
        );
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      const wallet = this._wallet;
      if (!wallet)
        throw new WalletNotActivatedError("Near Brower Wallet Not Activated!");

      try {
        // return await wallet?.signMessage(message);
        return await wallet?.sign(message);
      } catch (error: any) {
        throw new WalletSignTransactionError(
          `Near Browswer Wallet Transaction Signing Error: ${error}`
        );
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }

  async calculateGas(data: File, depositAmount?: string): Promise<Gas> {
    if (!data) return { totalTokensBurned: "0", totalGasBurned: 0 };
    try {
      const wallet = this._wallet;
      if (!wallet)
        throw new WalletNotActivatedError("Near Browser Wallet Not Activated!");

      try {
        const dataBuf = await data?.arrayBuffer();
        if (!dataBuf) {
          throw new Error(
            `Near Browser Wallet: failed to read ${data.type} file '${data.name}'`
          );
        }

        const bs64Txt = Buffer.from(dataBuf).toString("base64");

        const gas = await wallet.calculateGas(
          GAS_CALC_CONTRACT_ID,
          "addMessage",
          { text: bs64Txt },
          depositAmount ?? "0"
        );
        return gas;
      } catch (error: any) {
        throw new WalletSignTransactionError(
          `Near Browswer Wallet Transaction Signing Error: ${error}`
        );
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }
}
