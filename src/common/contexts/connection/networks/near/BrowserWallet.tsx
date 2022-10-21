import {
  Cluster,
  // clusterApiUrl,
  // Transaction,
  PublicKey as SolanaPublicKey,
  Transaction as SolanaTransaction,
  TransactionInstruction as SolanaTransactionInstruction,
  // sendAndConfirmTransaction,
  // Connection,
  // Keypair,
  // TransactionInstruction,
} from "@solana/web3.js";
import { EventEmitter as Emitter } from "eventemitter3";
import bs58 from "bs58";
import BN from "bn.js";
// import nacl from 'tweetnacl';
import React from "react";
import { Unsubscribe } from "redux";

import { ChainNetworks } from "../../../../contexts/connection/chains";

import { ContractWithMint } from "./hooks";
import { Wallet as DbWallet } from "../../../../localDB/db";
// import { getSavedWallets, updateWallet } from '../../../localDB/api';
// import { notify } from '../../../components/util/notification';
// import {
//   User as lUser,
//   Wallet as lWallet,
//   Item as lItem,
// } from '../../../store/types/webWalletTypes';
// import {
//   getKeyPairFromPrivateKey,
//   getNativeKeyPairFromPrivateKey,
// } from '../../../utils/wallets';
// import { SolanaKeypair } from '../../../utils/wallets/solana';
import { removeEd25519, KeyType } from "./utils";
import { KeyPair as lKeypair } from "../../../../store/types/webWalletTypes";
import CryptoJS from "crypto-js";
import {
  Near,
  connect as nearConnect,
  keyStores,
  Contract,
  WalletConnection,
  KeyPair,
  utils,
  transactions,
  ConnectedWalletAccount,
} from "near-api-js";
import { PublicKey as NearPublicKey } from "near-api-js/lib/utils";
import {
  // signTransaction as signNearTransaction,
  SignedTransaction,
  Signature as NearSignature,
  Transaction,
  createTransaction as createNearTransaction,
  transfer,
} from "near-api-js/lib/transaction";
// import { Signer, InMemorySigner } from 'near-api-js/lib/signer';
import {
  // KeyPairEd25519,
  Signature,
} from "near-api-js/lib/utils/key_pair";
// import { Provider } from 'near-api-js/lib/providers/provider';
import { serialize, base_decode } from "near-api-js/lib/utils/serialize";
// import { sendJsonRpc } from 'near-api-js/lib/providers/json-rpc-provider';
import { JsonRpcProvider } from "near-api-js/lib/providers";
// import { sendJsonRpc } from './utils/helper-api';
// import { PublicKey } from 'near-api-js/lib/utils';
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
// import getConfig from 'next/config';

const MAX_GAS = "300000000000000";

export interface Gas {
  totalTokensBurned: string;
  totalGasBurned: number;
}

Buffer.from("");

// (method) BufferConstructor.from(data: WithImplicitCoercion<string | Uint8Array | readonly number[]>): Buffer (+3 overloads)

export const SCHEMA = new Map<any, any>([
  ...transactions.SCHEMA,
  [
    Buffer,
    {
      kind: "struct",
      fields: [["data", "u8"]],
    },
  ],
]);

// const nextConfig = getConfig();
// const publicRuntimeConfig = nextConfig.publicRuntimeConfig;

abstract class BrowserWalletAdapter extends Emitter {
  abstract get publicKey(): SolanaPublicKey | null;
  abstract get connected(): boolean;

  abstract connect(
    // publicKey: SolanaPublicKey,
    privateKey?: string
  ): Promise<string | void>;
  abstract disconnect(): Promise<void>;
  // abstract signTransaction(transaction: Transaction): Promise<Transaction>;
  // abstract signAllTransactions(
  //   transactions: Transaction[],
  // ): Promise<Transaction[]>;
  // abstract signMessage(
  //   data: Uint8Array,
  //   display: 'hex' | 'utf8',
  // ): Promise<Uint8Array>;
}

// type PromiseCallback = (...args: unknown[]) => unknown;

// type MessageHandlers = {
//   [id: string]: {
//     resolve: PromiseCallback;
//     reject: PromiseCallback;
//   };
// };

export interface BrowserWalletConfig {
  name?: string;
  network?: Cluster;
  networkId: string;
  nodeUrl: string;
  contractName: string;
  walletUrl: string;
  helperUrl: string;
  headers: {
    [key: string]: string | number;
  };
}

interface Props {
  focus: boolean;
}

interface State {
  wallet: WalletConnection | null;
  contract: ContractWithMint | null;
  currentAccount?: {
    accountId: string;
    balance: string;
  };
  signIn: () => Promise<void>;
  signOut: () => void;
  isSignedIn: boolean | undefined;
}

export class BrowserWallet extends React.Component<
  Props,
  State,
  BrowserWalletAdapter
> {
  public readonly emitter = new Emitter();
  public wallets: DbWallet[] | null;

  private _near: Near | null;
  private _connection: WalletConnection | null;
  private _account: ConnectedWalletAccount | null;
  private _config: BrowserWalletConfig;
  // private _keypair: lKeypair | null;
  private _keypair: KeyPair | undefined;
  private _nearPublicKey: NearPublicKey | null;
  private _solanaPublicKey: SolanaPublicKey | null;
  private _privateKey: string | null;
  private _loaded: boolean = false;
  private _selected: boolean = false;
  private _connected: boolean = false;
  private _loading: boolean = false;
  private _autoConnect: boolean = false;

  // private _dbWallets: DbWallet[] | null;
  private unsubscribeStore: Unsubscribe | null;

  constructor(config: BrowserWalletConfig, props?: any) {
    super(props);
    this._near = null;
    this._connection = null;
    this._account = null;
    this._config = config;
    // this._dbWallets = null;
    this._keypair = undefined;
    this._nearPublicKey = null;
    this._solanaPublicKey = null;
    this._privateKey = null;
    this.wallets = [];
    this.unsubscribeStore = null;
  }

  state = this.getInitialState();

  getInitialState() {
    const _initialState: State = {
      wallet: null,
      contract: null,
      currentAccount: {
        accountId: "",
        balance: "",
      },
      signIn: async () => {},
      signOut: () => {},
      isSignedIn: false,
      // loadAccount: () => {},
    };
    return _initialState;
  }

  updateState = async () => {
    const _currentState = this.getInitialState();
    if (this.state !== _currentState) {
      this.setState(_currentState);
    }
  };

  getImplicitAccountId = (publicKey: string) => {
    const id = Buffer.from(bs58.decode(publicKey)).toString("hex");
    console.debug(`Implicit Account ID(${publicKey}): ${id}`);
    return id;
  };

  getPublicKey = (publicKey: string) => {
    console.debug(`Near: getPublicKey: ${publicKey}`);
    // const pubKey = SolanaPublicKey.fromString(publicKey).toString();
    const pubKey = publicKey;
    // Parse string for the base58 key
    const pubKeyBase58 = pubKey
      .toString()
      .substring(8, pubKey.toString().length);
    console.debug(`Near: pubKeyBase58: ${pubKeyBase58}`);
    const accountID = this.getImplicitAccountId(pubKeyBase58);
    return {
      chain: ChainNetworks.NEAR,
      publicKey: pubKeyBase58,
      implicitId: accountID,
    } as lKeypair;
  };

  async componentDidMount() {
    await this.updateState();
    // this.unsubscribeStore = store.subscribe(this.updateState);
  }

  async componentWillUnmount() {
    this.unsubscribeStore!();
  }

  async componentDidUpdate() {
    // if (prevProps.query !== this.props. && query !== "*") {
    //   ...
    // }
  }

  get readyState() {
    return "Installed";
  }

  get publicKey() {
    return this._solanaPublicKey;
  }

  _getPublicKey = (key: string) => {
    const solPubkey = new SolanaPublicKey(key);
    this.emitter.emit("connect", solPubkey);
    this.emitter.emit("publicKey", solPubkey);
    return solPubkey;
  };

  get keyPair() {
    return this._getKeyPair();
  }

  _getKeyPair = async () => {
    if (!this.isSignedIn()) return;
    const networkId = this._config.networkId;
    const accountId = this._getAccountId();
    if (!accountId) return;
    const keyPair = await this._connection?._keyStore.getKey(
      networkId,
      accountId
    );
    // const testKey = 'ed25519:5P673qY7cqjGkRYXRRFcPjNaGLU4G4GKVMbHwFRBK582UDqzJ55s1XapuvB4hHZHYyXabCiGMsVVFpeMnnYHdXbx'
    // const keyPair = KeyPair.fromString(testKey);
    this._keypair = keyPair;
    // console.warn('testKye pubKey', keyPair.getPublicKey.toString())
    return keyPair;
  };

  get autoConnect() {
    return this._autoConnect;
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
    return this._config.name;
  }

  get network() {
    return this._config.network;
  }

  get account() {
    return this._getAccount();
  }

  get accountId() {
    return this._getAccountId();
  }

  get config() {
    return this._config;
  }

  get connection() {
    return this._connection;
  }

  get contract() {
    return this._getContract();
  }

  _getAccount = () => {
    if (!this._connection) return;
    console.error("_getAccountId");
    const account = this._connection.account();
    console.error("account");
    console.dir(account);
    return account;
  };

  _getAccountId = () => {
    if (!this._connection) return;
    console.error("_getAccountId");
    const accountId: string = this._connection.getAccountId();
    console.error("accountId");
    console.dir(accountId);
    return accountId;
  };

  requestSignIn = (
    contractId?: string,
    successUrl?: string,
    failureUrl?: string
  ) => {
    if (!this._connection) return;
    return this._connection?.requestSignIn(contractId, successUrl, failureUrl);
  };

  _getContract = () => {
    if (!this._connection) return;

    const contract: Contract = new Contract(
      this._connection.account(),
      this._config.contractName,
      {
        viewMethods: ["nft_tokens_for_owner"],
        changeMethods: ["nft_mint"],
      }
    );
    return contract;
  };

  // _provider = () =>{
  //   return this._connection?
  // }

  _connect = async () => {
    this._loading = true;

    console.error("Browser Wallet: _connect()");
    const keyStore = new keyStores.BrowserLocalStorageKeyStore();
    console.error("keyStore");
    console.dir(keyStore);
    this._near = await nearConnect({
      ...this._config,
      keyStore: keyStore,
    });

    console.error("this._near ");
    console.dir(this._near);

    this._connection = new WalletConnection(this._near, "helloworld");
    console.error("this._connection");
    console.dir(this._connection);
    // this.signIn();

    // const accountId = this._connection.getAccountId();
    const accountId = this._getAccountId();
    console.info("BrowserWallet, accountId", accountId);

    if (accountId) {
      const accountState = await this._connection.account().state();
      console.error("accountState");
      console.dir(accountState);

      const contract = this._getContract();
      if (!contract) {
        this._loading = false;
        return;
      }
      console.error("contract");
      console.dir(contract);

      // initial contract.

      // const walletConnection = new WalletConnection(nearConnection);
      const walletAccountObj = this._connection.account();
      console.error("walletAccountObj");
      console.dir(walletAccountObj);
      const details = await walletAccountObj.getAccountDetails();
      console.error("details");
      console.dir(details);

      const keys = await walletAccountObj.getAccessKeys();
      // const accessKeys = keys.map(k => {
      //   return k.public_key.toString();
      // })
      console.error("keys");
      console.dir(keys);

      //   this.setState({
      //     wallet: this._connection,
      //     contract,
      //     currentAccount: {
      //       accountId,
      //       balance: accountState.amount,
      //     },
      //     signIn: this.signIn,
      //     // signIn: async () => {
      //     //   await this._connection?.requestSignIn(this._config.contractName);
      //     // },
      //     signOut: this.signOut,
      //     // signOut: () => this._connection?.signOut(),
      //     isSignedIn: this.isSignedIn(),
      //     // isSignedIn: this._connection?.isSignedIn(),
      //   });
      // } else {
      //   this.setState({
      //     ...this.state,
      //     signIn: this.signIn,
      //     // signIn: async () => {
      //     //   await this._connection?.requestSignIn(this._config.contractName);
      //     // },
      //   });
    }
    this._loading = false;
    console.error("Browser Wallet: _connect() end");
  };

  getImplicitAccountIdFromPrivateKey = (privateKey: string) => {
    // Generate Near Keypair
    const keyPair = KeyPair.fromString(privateKey);
    // Get Public key
    const publicKey = keyPair.getPublicKey();
    // Parse string for the base58 key
    const base58 = publicKey
      .toString()
      .substring(8, publicKey.toString().length);
    // Get the implicit account id
    const account = Buffer.from(bs58.decode(base58)).toString("hex");
    console.debug(`Implicit Account ID(${base58}): ${account}`);
    return account;
  };

  signIn = async () => {
    console.error("requesting SignIn");
    this._loading = true;
    await this._connection?.requestSignIn(this._config.contractName);
    this._loading = false;
    return;
  };

  signOut = async () => {
    if (!this.isSignedIn()) return;
    console.error("requesting SignOut");
    return this._connection?.signOut();
  };

  isSignedIn = () => {
    console.error("requesting isSignedIn");
    if (!this._connection) {
      throw new Error("Wallet not connected");
    }
    return this._connection?.isSignedIn();
  };

  setPublicKey = (key: string) => {
    console.info(`setting public key: ${key}`);
    this._nearPublicKey = NearPublicKey.fromString(key);
    console.info("Near Public Key ", this._nearPublicKey.toString());
    this._solanaPublicKey = this._getPublicKey(removeEd25519(key));
    console.info("Solana Public Key ", this._solanaPublicKey.toBase58());
  };

  async connect() {
    console.error("Browser Wallet: connect()");
    this._loading = true;

    await this._connect();
    const keypair = await this.keyPair;
    console.info("connect: keypair");
    console.dir(keypair);

    this._loading = false;

    if (!this._connection) {
      throw new Error("Wallet not connected");
    }

    // console.info('this.isSignedIn()', this.isSignedIn())
    // if (!this.isSignedIn()) await this.signIn();

    this._connected = true;
    this._selected = true;
    console.error("this._connected", this._connected);

    this.emitter.emit("connect");
    console.debug("Near Browser Wallet connected");
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

    this.signOut();
    this.emitter.emit("disconnect");
    console.debug("Near Browser Wallet disconnected");
    // notify({
    //   message: 'Disconnected',
    //   description: '',
    //   type: 'info'
    // });
  }

  _createTransaction = async (): Promise<Transaction> => {
    // if (!this._privateKey) {
    //   throw new Error('Private keys not found!');
    // }

    if (!this.accountId) {
      throw new Error("Account Id not found!");
    }

    if (!this._nearPublicKey) {
      throw new Error("Public Key not found!");
    }

    // const keyPair = KeyPairEd25519.fromString(this._privateKey);
    // const publicKey = keyPair.getPublicKey()
    // const publicKey = new NearPublicKey(removeEd25519(this.publicKey.toBase58()));

    console.info("this._config.contractName");
    console.dir(this._config.contractName);

    const accessKeyTest = await this.getAccessKey();
    console.info("_createTransaction: accessKeyTest");
    console.dir(accessKeyTest);

    const provider = new JsonRpcProvider(this._config.nodeUrl);
    const accessKey = await provider.query(
      `access_key/${
        this._config.contractName
      }/${this._nearPublicKey.toString()}`,
      ""
    );
    console.info("_createTransaction: accessKey");
    console.dir(accessKey);
    //@ts-ignore
    const nonce = accessKey.nonce + 1;
    console.info("_createTransaction: nonce");
    console.dir(nonce);
    const recentBlockHash = base_decode(accessKey.block_hash);
    console.info("_createTransaction: recentBlockHash");
    console.dir(recentBlockHash);
    const actions = [transfer(new BN(1))];

    const transaction = createNearTransaction(
      this.accountId,
      this._nearPublicKey,
      this.accountId,
      nonce,
      actions,
      recentBlockHash
    );
    console.info("_createTransaction: transaction");
    console.dir(transaction);
    return transaction;
  };

  _signTransaction = async (
    transaction: SolanaTransactionInstruction
  ): Promise<string | undefined> => {
    console.warn("func: _signTransaction");

    if (!this._keypair) {
      throw new Error("No keypairs found!");
    }

    console.debug("_signTransaction: transaction");
    console.dir(transaction);
    console.debug("_signTransaction: SCHEMA");
    console.dir(SCHEMA);

    const nearTx = await this._createTransaction();
    console.debug("_signTransaction: nearTx");
    console.dir(nearTx);
    console.dir(transaction);

    // const serializedTx = serialize(SCHEMA, transaction.data);
    const serializedTx = serialize(transactions.SCHEMA, nearTx);
    console.debug("_signTransaction: serializedTx", serializedTx);
    const encodedSerializedTx = bs58.encode(serializedTx);
    console.debug("_signTransaction: encodedSerializedTx", encodedSerializedTx);

    const serializedTxHash = CryptoJS.SHA256(encodedSerializedTx).toString();
    console.debug("_signTransaction: serializedTxHash", serializedTxHash);
    const serializedTxHashBuf = Buffer.from(serializedTxHash);
    console.debug("_signTransaction: serializedTxHashBuf", serializedTxHashBuf);

    const signature = this._keypair.sign(serializedTxHashBuf);
    console.debug("signature", signature);
    if (!signature || !signature.signature) {
      console.error("_signTransaction: signature empty!");
      return;
    }

    const signedTransaction = new SignedTransaction({
      transaction,
      // nearTx,
      signature: new NearSignature({
        // keyType: transaction.publicKey.keyType,
        keyType: KeyType.BASE58,
        data: signature.signature,
      }),
    });
    console.info("_signTransaction: signedTransaction");
    console.dir(signedTransaction);
    if (!signedTransaction) {
      console.error("_signTransaction: signedTransaction empty!");
      return;
    }

    // encodes transaction to serialized Borsh (required for all transactions)

    try {
      const signedSerializedTx = signedTransaction.encode();
      const provider = new JsonRpcProvider(this._config.nodeUrl);
      const result = await provider.query("broadcast_tx_commit", [
        // const result = await sendJsonRpc("broadcast_tx_commit", [
        Buffer.from(signedSerializedTx).toString("base64"),
      ]);
      console.info("_signTransaction: result");
      console.dir(result);
      const sig = bs58.encode(signedTransaction.encode());
      console.info(`Near tx sig 1: ${sig}`);
      return sig;
    } catch (e) {
      console.error(e);
      const sig = bs58.encode(signature.signature);
      console.info(`Near tx sig 2: ${sig}`);
      return sig;
    }
  };

  _verifySignature = (data: Uint8Array, signature: Uint8Array) => {
    if (!this._keypair) {
      throw new Error("No keypairs found!");
    }
    if (!this.accountId) {
      throw new Error("Account Id not found!");
    }
    const isValid = this._keypair.verify(data, signature);
    console.info("_verifySignature: Signature Valid?:", isValid);
    return isValid;
  };

  verifySignature = (msg: string, signature: Uint8Array) => {
    const msgBuf = Buffer.from(msg);
    const isValid = this._verifySignature(msgBuf, signature);
    console.info("verifySignature: Signature Valid?:", isValid);
    return isValid;
  };

  async signTransaction(
    transaction: SolanaTransaction
  ): Promise<SolanaTransaction> {
    console.warn("func: signTransaction");

    if (!this.connected) {
      throw new Error("Wallet not connected");
    }
    if (!this.selected) {
      throw new Error("Wallet not selected");
    }

    if (!this.publicKey) {
      throw new Error("Public key not set!");
    }

    if (!this._keypair) {
      throw new Error("No keypairs found!");
    }

    // const { keypair } = getNativeKeyPairFromPrivateKey(
    //   ChainNetworks.SOL,
    //   this._keypair?.privateKey ?? '',
    // ) as SolanaKeypair;

    // console.debug('transaction', transaction);
    // const newTx = new SolanaTransaction();
    // console.info('signTransaction: newTx empty!')
    // console.dir(newTx)
    // newTx.recentBlockhash = transaction.recentBlockhash;
    // newTx.feePayer = transaction.feePayer;
    // newTx.instructions = transaction.instructions;

    // console.info('signTransaction: newTx pre sigs!')
    // console.dir(newTx)

    const signaturePromises = transaction.instructions.map((instruction) => {
      const keys = instruction.keys.map((k) => k.pubkey.toBase58());
      console.info(`signing for:`);
      console.table(keys);
      return this._sign(instruction.data);
    });

    const instructionSignatures = await Promise.all(signaturePromises);

    return new Promise<SolanaTransaction>((resolve, reject) => {
      console.info("signing keys for ", transaction.feePayer?.toBase58());
      // const transactionBuffer = transaction.serializeMessage();
      const signatures = instructionSignatures.map((sigs) => {
        // const nearTx = new Transaction(instruction);
        // const sig = this._signTransaction(instruction);
        // const sigBuf = await this.sign(instruction.data);
        // const keys = instruction.keys.map(k => k.pubkey.toBase58());
        // console.info(`signing for:`)
        // console.table(keys)
        const { signature, publicKey } = sigs;
        const encodedSig = bs58.encode(Buffer.from(signature));
        const pubKeyStr = removeEd25519(publicKey.toString());
        // const sig = bs58.encode(sigBuf);
        // return sigBuf
        return { encodedSig, pubKeyStr };
        // return sig
      });

      // const signatures = await Promise.all(signaturePromises)
      console.info(signatures);
      console.table(signatures);

      // const signature = signatures[0];
      // console.debug('transactionBuffer', transactionBuffer);
      // console.debug('signTransaction: signature', signature);
      if (!signatures || signatures.length < 1) {
        console.error("signTransaction: empty signature!");
        reject(transaction);
        return;
      }

      console.debug("transaction", transaction);
      const newTx = new SolanaTransaction();
      console.info("signTransaction: newTx empty!");
      console.dir(newTx);
      newTx.recentBlockhash = transaction.recentBlockhash;
      newTx.feePayer = transaction.feePayer;
      newTx.instructions = transaction.instructions;

      console.info("signTransaction: newTx pre sigs!");
      console.dir(newTx);

      if (!this.publicKey) {
        console.error("signTransaction: empty public Key!");
        reject(transaction);
        return;
      }
      const pubKey = this.publicKey;
      // signatures.forEach(sig => newTx.addSignature(pubKey, bs58.decode(sig)))
      // signatures.forEach(sig => newTx.addSignature(pubKey, Buffer.from(sig.encodedSig)))
      signatures.forEach((sig) =>
        newTx.addSignature(pubKey, Buffer.from(bs58.decode(sig.encodedSig)))
      );

      console.info("signTransaction: added sigs!");
      console.dir(newTx);
      console.dir(transaction);

      // transaction.addSignature(this.publicKey, bs58.decode(signature));
      // console.info('signTransaction: added sigs! 2')
      // console.dir(newTx)

      resolve(transaction);
    });
  }

  requestSignTransaction = async (
    transaction: Transaction
  ): Promise<Transaction> => {
    if (!this.connected) {
      throw new Error("Wallet not connected");
    }
    if (!this.selected) {
      throw new Error("Wallet not selected");
    }

    if (!this._connection) {
      throw new Error("Wallet not connected");
    }

    if (!transaction) {
      throw new Error("No transaction received!");
    }

    await this._connection.requestSignTransactions([transaction]);
    return transaction;
  };

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    // ): Promise<void> {
    if (!this.connected) {
      throw new Error("Wallet not connected");
    }

    if (!this.selected) {
      throw new Error("Wallet not selected");
    }

    if (!this._connection) {
      throw new Error("Wallet not connected");
    }

    if (!transactions || transactions.length < 1) {
      throw new Error("No transactions received!");
    }

    console.warn("this._connection");
    console.dir(this._connection);
    console.dir(transactions);

    // this._connection.requestSignTransactions(transactions)
    return transactions;

    // const _txs = transactions.map(transaction => {
    //   return this.signTransaction(transaction);
    // });
    // return await Promise.all(_txs);
  }

  _signWithKey = async (
    pubKey: SolanaPublicKey,
    data: Uint8Array
  ): Promise<Signature> => {
    if (!this.connected) {
      throw new Error("Wallet not connected");
    }
    if (!this.selected) {
      throw new Error("Wallet not selected");
    }
    if (!this._keypair) {
      throw new Error("No keypairs found!");
    }
    return this._keypair.sign(data);
  };

  _sign = async (data: Uint8Array): Promise<Signature> => {
    if (!this.connected) {
      throw new Error("Wallet not connected");
    }
    if (!this.selected) {
      throw new Error("Wallet not selected");
    }
    if (!this._keypair) {
      throw new Error("No keypairs found!");
    }
    console.warn("func: _sign");
    console.info(
      "this._keypair pubKey",
      this._keypair.getPublicKey().toString()
    );
    console.info("this._keypair keytype", this._keypair.getPublicKey().keyType);
    console.info("near pubKey", this._nearPublicKey?.toString());
    console.info("near pubKey keytype", this._nearPublicKey?.keyType);
    console.info("solana pubKey", this._solanaPublicKey?.toBase58());
    console.info("pubKey", this.publicKey?.toBase58());
    console.info("connected account", this._connection?._connectedAccount);
    console.info("account", this._connection?.account.toString());
    console.info("connected Account", this._connection?._connectedAccount);
    console.dir("_authDataKey");
    console.dir(this._connection?._authDataKey);
    // this._connection?._completeSignInWithAccessKey()
    console.info("accountId", this._connection?.getAccountId());
    console.info("is signedin", this._connection?.isSignedIn);
    console.dir(this._connection);
    return this._keypair.sign(data);
  };

  async signMessage(msg: string): Promise<string> {
    console.warn("func: signMessage");
    if (!this.connected) {
      throw new Error("Wallet not connected");
    }

    if (!this.selected) {
      throw new Error("Wallet not selected");
    }

    console.info("signMessage: msg", msg);
    const msgBuf = Buffer.from(msg);
    console.dir(msgBuf);

    const signature = await this._sign(msgBuf);
    console.info("signMessage: signature");
    console.dir(signature);
    const isValid = this._verifySignature(msgBuf, signature.signature);
    console.info("signedMessage valid?", isValid);

    return bs58.encode(signature.signature);
  }

  sign = async (data: Uint8Array): Promise<Uint8Array> => {
    if (!this.connected) {
      throw new Error("Wallet not connected");
    }

    if (!this.selected) {
      throw new Error("Wallet not selected");
    }

    if (!this._keypair) {
      throw new Error("No keypairs found!");
    }

    if (!this.isSignedIn) this.signIn();

    const signature = await this._sign(data);
    console.info("signMessage: signature", signature.publicKey.toString());
    console.dir(signature);
    const isValid = this._verifySignature(data, signature.signature);
    console.info("sign valid?", isValid);
    return signature.signature;
  };

  getAccessKey = async () => {
    console.warn("func: getAccessKeys");
    if (!this._near) {
      throw new Error("Wallet not connected");
    }

    if (!this.connected) {
      throw new Error("Wallet not connected");
    }

    if (!this.selected) {
      throw new Error("Wallet not selected");
    }

    if (!this._connection) {
      throw new Error("Wallet not connected");
    }

    if (!this._nearPublicKey) {
      throw new Error("Public key not found!");
    }

    if (!this.accountId) {
      throw new Error("Account Id not found!");
    }

    const response = await this._near.connection.provider.query({
      request_type: "view_access_key",
      finality: "final",
      account_id: this.accountId,
      public_key: this._nearPublicKey.toString(),
    });
    console.info("getAccessKeys: response");
    console.dir(response);
    return response;
  };

  calculateGas = async (
    contractId: string,
    methodName: string,
    args: any,
    depositAmount?: string
  ): Promise<Gas> => {
    console.info("Calculating gas ...");
    // const near = await connect(config);
    // const account = await near.account(ACCOUNT_ID);
    if (!this._near || !this._connection) {
      throw new Error("Failed to conenct to Near!");
    }

    const accountId = this._getAccountId();
    if (!accountId) {
      throw new Error("Failed to get Account id!");
    }

    const parseDepositCheck = utils.format.parseNearAmount(
      depositAmount ?? "0"
    );
    if (!parseDepositCheck) {
      throw new Error(`Failed to parse deposit check of '${depositAmount}'`);
    }

    const account = await this._near.account(accountId);
    console.info("Pushing calc ...");
    const result = await account.functionCall({
      contractId,
      methodName,
      args,
      gas: new BN(MAX_GAS),
      // attachedDeposit: utils.format.parseNearAmount(depositAmount),
      attachedDeposit: new BN(parseDepositCheck),
    });
    const gasResult = result.receipts_outcome.reduce(
      (acc, receipt) => {
        acc.totalGasBurned += receipt.outcome.gas_burnt;
        acc.totalTokensBurned += utils.format.formatNearAmount(
          //@ts-ignore
          receipt.outcome.tokens_burnt
        );
        return acc;
      },
      {
        totalGasBurned: result.transaction_outcome.outcome.gas_burnt,
        totalTokensBurned: utils.format.formatNearAmount(
          //@ts-ignore
          result.transaction_outcome.outcome.tokens_burnt
        ),
      }
    );
    if (!gasResult) {
      throw new Error("Failed to pull gas cost from chain!");
    }

    const { totalGasBurned, totalTokensBurned } = gasResult;

    const gas = {
      totalTokensBurned,
      totalGasBurned,
    };
    console.error("Gas fees");
    console.dir(gas);
    return gas;
  };

  render() {
    if (this._loading) {
      return (
        <div className="loading-div">
          <Spin indicator={<LoadingOutlined />} />
        </div>
      );
    }
    return <></>;
  }
}
