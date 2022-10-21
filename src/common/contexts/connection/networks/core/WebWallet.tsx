import {
  Cluster,
  // clusterApiUrl,
  Transaction,
  PublicKey,
  Keypair,
  Ed25519Keypair,
  // sendAndConfirmTransaction,
  // Connection,
  // TransactionInstruction,
} from "@solana/web3.js";
import { EventEmitter as Emitter } from "eventemitter3";
import bs58 from "bs58";
import nacl from "tweetnacl";
import React from "react";
import { Unsubscribe } from "redux";

import { ChainNetworks } from "../..";
import {
  WalletName,
  WalletKeypairError,
} from "../../../../contexts/connection/networks/core/base";

import { Wallet as DbWallet } from "../../../../localDB/db";
import { getSavedWallets, updateWallet } from "../../../../localDB/api";
import { store } from "../../../../store/store";
import { notify } from "../../../../utils";
import {
  User as lUser,
  Wallet as lWallet,
  Item as lItem,
} from "../../../../store/types/webWalletTypes";
import {
  getKeyPairFromPrivateKey,
  getNativeKeyPairFromPrivateKey,
} from "../../../../utils/wallets";
import { SolanaKeypair } from "../../../../contexts/wallets/solana";
import { KeyPair as lKeypair } from "../../../../store/types/webWalletTypes";

abstract class WebWalletAdapter extends Emitter {
  abstract get publicKey(): PublicKey | null;
  abstract get connected(): boolean;

  abstract select(walletName: WalletName): Promise<string | void>;
  abstract connect(
    chain?: string,
    label?: string,
    privateKey?: Uint8Array
  ): Promise<string | void>;
  abstract disconnect(): Promise<void>;
  abstract signTransaction(transaction: Transaction): Promise<Transaction>;
  abstract signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]>;
  abstract signMessage(
    data: Uint8Array,
    display: "hex" | "utf8"
  ): Promise<Uint8Array>;
}

// type PromiseCallback = (...args: unknown[]) => unknown;

// type MessageHandlers = {
//   [id: string]: {
//     resolve: PromiseCallback;
//     reject: PromiseCallback;
//   };
// };

export interface WebWalletConfig {
  name: WalletName;
  network?: Cluster;
  node?: string;
}

interface Props {
  focus: boolean;
}
interface State {
  users: lUser[];
  wallets: lWallet[];
  items: lItem[];
}

export class WebWallet extends React.Component<Props, State, WebWalletAdapter> {
  public readonly emitter = new Emitter();
  public wallets: DbWallet[] | null;

  private _config: WebWalletConfig;
  private _name: WalletName;
  private _keypair: lKeypair | null;
  private _loaded: boolean = false;
  private _selected: boolean = false;
  private _connected: boolean = false;

  // private _dbWallets: DbWallet[] | null;
  private unsubscribeStore: Unsubscribe | null;

  constructor(config: WebWalletConfig, props?: any) {
    super(props);
    this._config = config;
    // this._dbWallets = null;
    this._name = config.name;
    this._keypair = null;
    this.wallets = [];
    this.unsubscribeStore = null;
  }

  state = this.getCurrentStateFromStore();

  getCurrentStateFromStore() {
    return {
      users: store.getState().users,
      wallets: store.getState().wallets,
      items: store.getState().items,
    };
  }

  updateStateFromStore = async () => {
    const _currentState = this.getCurrentStateFromStore();
    if (this.state !== _currentState) {
      this.setState(_currentState);
    }
  };

  async componentDidMount() {
    this.unsubscribeStore = store.subscribe(this.updateStateFromStore);
  }

  async componentWillUnmount() {
    this.unsubscribeStore!();
  }

  resetSelections = async () => {
    if (!this.wallets || this.wallets.length < 1) return;

    const _updatedWallets = this.wallets.map((_wallet) => {
      const _wallets = (async () => {
        if (_wallet.isSelected) {
          const _updatedWallet = {
            ..._wallet,
            isSelected: false,
          } as DbWallet;

          const result = await updateWallet(_updatedWallet)
            .then((wallet) => {
              return wallet;
            })
            .catch((err) => {
              console.error(err);
            });
          console.debug(
            `deselected wallet ${_wallet.pubKey} result: ${result}`
          );
          return !result || !isNaN(result) ? _wallet : _updatedWallet;
        }
        return _wallet;
      })();
      return _wallets;
    });
    this.wallets = await Promise.all(_updatedWallets);
  };

  _verifySelectionConsistency = async () => {
    if (!this.wallets || this.wallets.length < 1) {
      console.warn(
        "Unable to verify wallet selection consistency, local database is empty!"
      );
      return;
    }
    console.debug(`loadDB wallets: ${this.state.wallets.length}`);
    const _selectedWallets = this.wallets.filter((w) => w.isSelected);
    console.debug(`selected wallets: ${_selectedWallets.length}`);

    if (_selectedWallets.length > 1) {
      this.resetSelections();
    }
  };

  _fetchDbWallets = async () => {
    const _wallets = await getSavedWallets()
      .then((_wallets) => {
        this.wallets = _wallets!;
        this._loaded = true;
        return _wallets;
      })
      .catch((err) => {
        console.error(err);
      });
    return _wallets;
  };

  _loadDbWallet = async (chain: string, privateKey: string) => {
    if (!this.loaded) {
      console.debug("Please first load the local database!");
      return;
    }

    if (!this.wallets || this.wallets.length < 1) {
      console.debug("Unable to load wallet, local database is empty.");
      return;
    }

    console.debug("Loading IndexDB pubKeys");
    // const keypairs: Keypair[] = this.wallets?.filter(({seed}) => seed).map(({seed}) => Keypair.fromSeed(Buffer.from(seed)));
    // const keypairs: lKeypair[] = this.wallets?.filter(({seed}) => seed).map(({seed}) => Keypair.fromSeed(Buffer.from(seed)));

    // const wallet = keypairs?.find(key => key.secretKey.toString() === privateKey)
    const keypair = getKeyPairFromPrivateKey(chain, privateKey);
    if (!keypair) {
      console.error("failed to find IndexDB key!");
      notify({
        message: "WebWallet",
        description: "failed to find IndexDB key!",
        type: "error",
      });
      return;
    }
    console.info(`Loading keypair: ${keypair.publicKey}`);
    return keypair;
  };

  _loadSelectedDbWallet = async (
    chain: string,
    privateKey: string,
    force?: boolean
  ) => {
    let wallets: DbWallet[] | void;
    if (!this.loaded) {
      wallets = await this._fetchDbWallets();
    }

    // if (!this.wallets || this.wallets.length < 1) {
    if (!wallets || wallets.length < 1) {
      console.warn("Unable to selected a wallet, local database is empty!");
      return;
    }

    // const primaryWallets = this.wallets.filter(wlt => wlt.label === 'primary');
    const primaryWallets = wallets.filter((wlt) => wlt.label === "primary");
    if (!primaryWallets || primaryWallets.length < 1) return;

    // const selectedPrimaryWallets = this.wallets.filter(wlt => wlt.label === "primary" && wlt.isSelected);
    const selectedPrimaryWallets = primaryWallets.filter(
      (wlt) => wlt.isSelected
    );
    if (!force && selectedPrimaryWallets.length > 1) {
      console.warn(
        `Unable to determine which selected wallet to load. There are ${selectedPrimaryWallets.length} wallets marked as selected! '${force}'`
      );
      // this._verifySelectionConsistency();
      return;
    }

    if (selectedPrimaryWallets.length === 1) {
      // return Keypair.fromSeed(Buffer.from(selectedPrimaryWallets[0].seed))
      return getKeyPairFromPrivateKey(chain, privateKey);
    }

    // const selectedDbWallet = this.wallets.find(wallet => wallet.isSelected);
    // if (selectedDbWallet) {
    //   console.warn(`Selected IndexDB wallet: '${selectedDbWallet?.label}'`);
    //   //@TODO: this needs to be chain agnostic
    //   const wallet = Keypair.fromSeed(Buffer.from(selectedDbWallet.seed));
    //   console.warn(`Selected IndexDB wallet keypair: '${wallet.publicKey.toBase58()}'`);
    //   this._selected = true;
    //   return wallet;
    // };

    if (force) {
      console.warn(`No wallet selected! using most recent wallet: '${force}'`);
      // return Keypair.fromSeed(Buffer.from(primaryWallets[primaryWallets.length - 1].seed));
      return getKeyPairFromPrivateKey(chain, privateKey);
    }
  };

  get readyState() {
    return "Installed";
  }

  get publicKey(): PublicKey | null {
    if (!this._keypair) return null;
    return new PublicKey(this._keypair.publicKey);
  }

  get secretKey(): Uint8Array | null {
    if (!this._keypair || !this._keypair.privateKey) return null;
    return bs58.decode(this._keypair.privateKey);
  }

  get keypair(): Keypair | null {
    if (!this.publicKey || !this.secretKey) return null;
    const key = {
      publicKey: bs58.decode(this.publicKey.toBase58()),
      secretKey: this.secretKey,
    } as Ed25519Keypair;
    return new Keypair(key);
  }

  get loaded() {
    return this._loaded;
  }

  get selected() {
    return this._selected;
  }

  get connected() {
    return this._connected;
  }

  get disconnected() {
    return !this._connected;
  }

  get autoApprove() {
    return false;
  }

  get name() {
    return this._name ?? this._config.name;
  }

  get network() {
    return this._config.network;
  }

  get node() {
    return this._config.node;
  }

  async loadDb() {
    let wallets: DbWallet[] | void;
    if (!this.loaded) {
      wallets = await this._fetchDbWallets();
    }
    if (!wallets || wallets.length < 1) {
      return;
    }
    this.wallets = wallets;
    return wallets;
  }

  async select(walletName: WalletName) {
    this._name = walletName;
    this._selected = true;

    this.emitter.emit("select", walletName);
  }

  async setCredentials(chain: string, label: string, privateKey: Uint8Array) {
    console.error("func(WebWallet): setCredentials");
    // if (!this.loaded) {
    //   console.error('Please first load the local database!');
    //   return;
    // }
    // if (!this._keypair) {
    //   console.error('Please first load a Keypair!');
    //   return;
    // }

    // if (!this.loaded) {
    //   console.error('Please first load the local database!');
    //   return;
    // }

    // if (!this.wallets || this.wallets.length < 1) {
    //   console.error('Please first populate the local wallet database');
    //   return;
    // }

    // let keypair: lKeypair | undefined;
    // // if (this.loaded && this.wallets && chain && privateKey) {
    // if (this.loaded && this.wallets && chain && privateKey) {
    //   console.error(
    //     privateKey ? 'loading keypair ...' : 'loading selected ...',
    //   );
    //   keypair = privateKey
    //     // ? await this._loadDbWallet(chain, privateKey)
    //     // : await this._loadSelectedDbWallet(chain, privateKey, force);
    //     ? await this._loadDbWallet(chain, bs58.encode(privateKey))
    //     : await this._loadSelectedDbWallet(chain, bs58.encode(privateKey));
    // }

    // if (!keypair) {
    //   console.error('There are no keypairs to load.');
    //   //@TODO: Is it a good idea to notify users? if so, this is shown 3x on new database init; fix so only show's once if triggered.
    //   // notify({
    //   //   message: 'WebWallet',
    //   //   description: 'No keypairs found!',
    //   //   type: 'error'
    //   // });
    //   return;
    // }

    const keypair = Keypair.fromSecretKey(privateKey);
    if (!keypair) {
      throw new WalletKeypairError(`Unable to create a keypair!`);
    }

    this._keypair = {
      chain: chain,
      privateKey: bs58.encode(keypair.secretKey),
      publicKey: keypair.publicKey.toBase58(),
    } as lKeypair;
  }

  async connect(
    chain?: string,
    label?: string,
    privateKey?: Uint8Array,
    force?: boolean
  ) {
    if (!this.loaded) {
      console.error("Please first load the local database!");
      return;
    }

    if (!this.loaded) {
      console.error("Please first load the local database!");
      return;
    }

    if (!this.wallets || this.wallets.length < 1) {
      console.error("Please first populate the local wallet database");
      return;
    }

    let keypair: lKeypair | undefined;
    if (this.loaded && this.wallets && chain && privateKey) {
      console.debug(
        privateKey ? "loading keypair ..." : "loading selected ..."
      );
      keypair = privateKey
        ? await this._loadDbWallet(chain, bs58.encode(privateKey))
        : await this._loadSelectedDbWallet(
            chain,
            bs58.encode(privateKey),
            force
          );
    } else if (this._keypair) {
      keypair = this._keypair;
    }

    // keypair = this._keypair;

    if (!keypair) {
      console.error("There are no keypairs to load.");
      //@TODO: Is it a good idea to notify users? if so, this is shown 3x on new database init; fix so only show's once if triggered.
      // notify({
      //   message: 'WebWallet',
      //   description: 'No keypairs found!',
      //   type: 'error'
      // });
      return;
    }

    this._keypair = keypair;
    console.debug(`Web Wallet ${chain} '${this._keypair.publicKey}' selected`);

    this._connected = true;

    // this.emitter.emit('connect', this.publicKey, chain, label, privateKey);
    this.emitter.emit("connect", this.publicKey);
    console.info("Web Wallet connected", this.name);
    // notify({
    //   message: 'Connected (D)',
    //   description: '',
    //   type: 'info'
    // });
  }

  async disconnect() {
    this._connected = false;
    this._selected = false;
    this._loaded = false;

    this.emitter.emit("disconnect");
    console.debug("Web Wallet disconnected");
    // notify({
    //   message: 'Disconnected',
    //   description: '',
    //   type: 'info'
    // });
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.connected) {
      throw new Error("Wallet not connected");
    }
    if (!this.selected) {
      throw new Error("Wallet not selected");
    }
    if (!this._keypair) {
      throw new Error("No keypairs found!");
    }

    const { keypair } = getNativeKeyPairFromPrivateKey(
      ChainNetworks.SOL,
      this._keypair?.privateKey ?? ""
    ) as SolanaKeypair;

    console.debug("transaction", transaction);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise<Transaction>((resolve, reject) => {
      const transactionBuffer = transaction.serializeMessage();
      const signature = bs58.encode(
        nacl.sign.detached(transactionBuffer, keypair?.secretKey)
      );
      console.debug("transactionBuffer", transactionBuffer);
      console.debug("signature", signature);

      transaction.addSignature(keypair?.publicKey!, bs58.decode(signature));
      resolve(transaction);
    });
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    if (!this.connected) {
      throw new Error("Wallet not connected");
    }

    if (!this.selected) {
      throw new Error("Wallet not selected");
    }

    const _txs = transactions.map((transaction) => {
      return this.signTransaction(transaction);
    });
    return await Promise.all(_txs);
  }

  async signMessage(
    data: Uint8Array,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    display: "hex" | "utf8" = "utf8"
  ): Promise<Uint8Array> {
    if (!this.connected) {
      throw new Error("Wallet not connected");
    }

    if (!this.selected) {
      throw new Error("Wallet not selected");
    }

    return data;
  }

  async sign(
    data: Uint8Array,
    display: "hex" | "utf8" = "utf8"
  ): Promise<Uint8Array> {
    return await this.signMessage(data, display);
  }
}
