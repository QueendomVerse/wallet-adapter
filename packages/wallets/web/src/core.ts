import {
    type Cluster,
    clusterApiUrl,
    type Transaction,
    PublicKey,
    Keypair,
    type Ed25519Keypair,
    // sendAndConfirmTransaction,
    Connection,
    // TransactionInstruction,
} from '@solana/web3.js';
import { EventEmitter as Emitter } from 'eventemitter3';
import { encode as encodeBs58, decode as decodeBs58 } from 'bs58';
import nacl from 'tweetnacl';
import React from 'react';
import type { Unsubscribe } from 'redux';

import type { WalletName } from '@mindblox-wallet-adapter/base';
import { notify } from '@mindblox-wallet-adapter/react';

import { ChainNetworks } from './chains';

import type {
    IndexDbWallet,
    // User as IndexDbUser
} from './indexDb';
import { getSavedIndexDbWallets, updateIndexDbWallet } from './indexDb';
import { store } from './store';

import type { LocalWallet } from './store';
import {
    // getPublicKey,
    getKeyPairFromPrivateKey,
    getNativeKeyPairFromPrivateKey,
    // getBalance,
    // NativeKeypair,
} from './networks';
import type { SolanaKeys } from './networks/solana';
// import { NearKeypair } from '../../utils/wallets/near';
import type { LocalKeyPair } from './store';
import { SOLANA_NETWORK } from './constants';

abstract class WebWalletAdapter extends Emitter {
    abstract get publicKey(): PublicKey | null;
    abstract get connected(): boolean;

    // abstract connect(privateKey?: string): Promise<string | void>;
    // abstract select(
    //   walletName: WalletName,
    //   chain?: string,
    //   privateKey?: string
    // ): Promise<string | void>;
    abstract select(walletName: WalletName): // chain?: string,
    // label?: string,
    // privateKey?: Uint8Array
    Promise<string | void>;
    abstract connect(chain?: string, label?: string, privateKey?: Uint8Array): Promise<string | void>;
    abstract disconnect(): Promise<void>;
    abstract signTransaction(transaction: Transaction): Promise<Transaction>;
    abstract signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
    abstract signMessage(data: Uint8Array, display: 'hex' | 'utf8'): Promise<Uint8Array>;
}

// type PromiseCallback = (...args: unknown[]) => unknown;

// type MessageHandlers = {
//   [id: string]: {
//     resolve: PromiseCallback;
//     reject: PromiseCallback;
//   };
// };

export interface WebWalletConfig {
    name?: string;
    network?: Cluster;
}

interface Props {
    focus?: boolean;
}
interface State {
    wallets: LocalWallet[];
}

export class WebWallet extends React.Component<Props, State, WebWalletAdapter> {
    public readonly emitter = new Emitter();
    public wallets: IndexDbWallet[] | null;

    private _connection: Connection;
    private _config: WebWalletConfig;
    private _name: WalletName | null;
    private _keypair: LocalKeyPair | null;
    private _loaded: boolean;
    private _selected: boolean;
    private _connected: boolean;

    // private _dbWallets: IndexDbWallet[] | null;
    private unsubscribeStore: Unsubscribe | null;

    constructor(config: WebWalletConfig, props: Props) {
        super(props);
        this._connection = new Connection(clusterApiUrl(SOLANA_NETWORK));
        this._config = config;
        // this._dbWallets = null;
        this._name = null;
        this.wallets = [];
        this.unsubscribeStore = null;

        this._keypair = null;
        this._loaded = false;
        this._selected = false;
        this._connected = false;
    }

    state = this.getCurrentStateFromStore();

    getCurrentStateFromStore() {
        return {
            wallets: store.getState().wallets,
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
        if (this.unsubscribeStore) {
            this.unsubscribeStore();
        }
    }

    resetSelections = async () => {
        if (!this.wallets || this.wallets.length < 1) return;

        const _updatedWallets = this.wallets.map((_wallet) => {
            const _wallets = (async () => {
                if (_wallet.isSelected) {
                    const _updatedWallet = {
                        ..._wallet,
                        isSelected: false,
                    } as IndexDbWallet;

                    const result = await updateIndexDbWallet(_updatedWallet)
                        .then((wallet) => {
                            return wallet;
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                    console.debug(`deselected wallet ${_wallet.pubKey} result: ${result}`);
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
            console.warn('Unable to verify wallet selection consistency, local database is empty!');
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
        const _wallets = await getSavedIndexDbWallets();
        this.wallets = _wallets || [];
        this._loaded = Boolean(_wallets);
        return _wallets;
    };

    _loadDbWallet = async (chain: string, privateKey: string) => {
        if (!this.loaded) {
            console.debug('Please first load the local database!');
            return;
        }

        if (!this.wallets || this.wallets.length < 1) {
            console.debug('Unable to load wallet, local database is empty.');
            return;
        }

        console.debug('Loading IndexDB pubKeys');
        // const keypairs: Keypair[] = this.wallets?.filter(({seed}) => seed).map(({seed}) => Keypair.fromSeed(Buffer.from(seed)));
        // const keypairs: LocalKeyPair[] = this.wallets?.filter(({seed}) => seed).map(({seed}) => Keypair.fromSeed(Buffer.from(seed)));

        // const wallet = keypairs?.find(key => key.secretKey.toString() === privateKey)
        const keypair = getKeyPairFromPrivateKey(chain, privateKey);
        if (!keypair) {
            console.warn('failed to find IndexDB key!');
            notify({
                message: 'WebWallet',
                description: 'failed to find IndexDB key!',
                type: 'error',
            });
            return;
        }
        console.info(`Loading keypair: ${keypair.publicKey}`);
        return keypair;
    };

    _loadSelectedDbWallet = async (chain: string, privateKey: string, force?: boolean) => {
        let wallets: IndexDbWallet[] | void = [];
        if (!this.loaded) {
            wallets = await this._fetchDbWallets();
        }

        // if (!this.wallets || this.wallets.length < 1) {
        if (!wallets || wallets?.length < 1) {
            console.warn('Unable to selected a wallet, local database is empty!');
            return;
        }

        // const primaryWallets = this.wallets.filter(wlt => wlt.label === 'primary');
        const primaryWallets = wallets.filter((wlt) => wlt.label === 'primary');
        if (!primaryWallets || primaryWallets.length < 1) return;

        // const selectedPrimaryWallets = this.wallets.filter(wlt => wlt.label === "primary" && wlt.isSelected);
        const selectedPrimaryWallets = primaryWallets.filter((wlt) => wlt.isSelected);
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
        return 'Installed';
    }

    get publicKey(): PublicKey | null {
        if (!this._keypair) return null;
        return new PublicKey(this._keypair.publicKey);
    }

    get secretKey(): Uint8Array | null {
        if (!this._keypair || !this._keypair.privateKey) return null;
        return decodeBs58(this._keypair.privateKey);
    }

    get keypair(): Keypair | null {
        if (!this.publicKey || !this.secretKey) return null;
        const key = {
            publicKey: decodeBs58(this.publicKey.toBase58()),
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

    async loadDb() {
        let wallets: IndexDbWallet[] | void = [];
        if (!this.loaded) {
            console.debug('loading IndexDb ...');
            wallets = await this._fetchDbWallets();
            // console.info('loadDB wallets ', this.state.wallets.length);
            console.debug('loadDB wallets ', wallets?.length);
        }
        console.debug('LoadDB wallets', wallets?.length);
        if (!wallets || wallets.length < 1) {
            console.warn('No wallets found!');
            return;
        }
        this.wallets = wallets;
        return wallets;
    }

    // async selectWallet(chain: string, privateKey: string, force?: boolean) {
    async selectWallet(chain: string, privateKey: string) {
        console.debug('func(WebWallet): selectWallet', chain, privateKey);
        if (!this.loaded) {
            console.warn('Please first load the local database!');
            return;
        }

        // if (!this.connected) {
        //   console.debug('Please initialize the web wallet!');
        //   return;
        // }

        if (!this.wallets || this.wallets.length < 1) {
            console.warn('Please first populate the local wallet database');
            return;
        }

        // let keypair: LocalKeyPair | undefined;
        // if (this.loaded && this.wallets && privateKey) {

        //   keypair = privateKey
        //     ? await this._loadDbWallet(chain, privateKey)
        //     : await this._loadSelectedDbWallet(chain, privateKey, force);
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

        // this._keypair = keypair;
        // console.debug(`Web Wallet ${chain} '${this._keypair.publicKey}' selected`);

        this._selected = true;
    }

    async select(walletName: WalletName) {
        console.debug('func(WebWallet): select', walletName);

        console.debug('select loaded?', this.loaded);
        if (!this.loaded) {
            console.warn('Please first load the local database!');
            return;
        }

        console.debug('select wallets?', this.wallets?.length);
        if (!this.wallets || this.wallets.length < 1) {
            console.warn('Please first populate the local wallet database');
            return;
        }

        // let keypair: LocalKeyPair | undefined;
        // if (this.loaded && this.wallets && chain && label && privateKey) {
        //   const walletName = `${capitalizeFirst(chain)}${capitalizeFirst(label)}WebWallet` as WalletName;

        //   console.debug(
        //     privateKey ? 'loading keypair ...' : 'loading selected ...',
        //   );
        //   keypair = privateKey
        //     ? await this._loadDbWallet(chain, encodeBs58(privateKey))
        //     : await this._loadSelectedDbWallet(chain, privateKey);

        //   this.emitter.emit('select', walletName, chain, privateKey);
        // }

        // if (!keypair) {
        //   console.debug('There are no keypairs to load.');
        //   //@TODO: Is it a good idea to notify users? if so, this is shown 3x on new database init; fix so only show's once if triggered.
        //   // notify({
        //   //   message: 'WebWallet',
        //   //   description: 'No keypairs found!',
        //   //   type: 'error'
        //   // });
        //   return;
        // }

        // this._keypair = keypair;
        // console.debug(`Web Wallet ${chain} '${this._keypair.publicKey}' selected`);

        this._name = walletName;
        this._selected = true;

        // this._selected = true;

        this.emitter.emit('select', walletName);
        // console.debug('Web Wallet connected');
        // notify({
        //   message: 'Connected (D)',
        //   description: '',
        //   type: 'info'
        // });
    }

    async connect(chain?: string, label?: string, privateKey?: Uint8Array, force?: boolean) {
        console.debug('func(WebWallet): connect');
        if (!this.loaded) {
            console.warn('Please first load the local database!');
            return;
        }
        // if (!this._keypair) {
        //   console.warn('Please first load a Keypair!');
        //   return;
        // }

        if (!this.wallets || this.wallets.length < 1) {
            console.warn('Please first populate the local wallet database');
            return;
        }

        let keypair: LocalKeyPair | undefined;
        if (this.loaded && this.wallets && chain && privateKey) {
            keypair = privateKey
                ? // ? await this._loadDbWallet(chain, privateKey)
                  // : await this._loadSelectedDbWallet(chain, privateKey, force);
                  await this._loadDbWallet(chain, encodeBs58(privateKey))
                : await this._loadSelectedDbWallet(chain, encodeBs58(privateKey), force);
        }

        if (!keypair) {
            console.warn('There are no keypairs to load.');
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

        console.debug('Connect', this.name, this.publicKey, this.secretKey);
        console.dir(this._config);

        this.emitter.emit('connect', this.publicKey, chain, label, privateKey);
        console.debug('Web Wallet connected');
        notify({
            message: 'Connected (D)',
            description: '',
            type: 'info',
        });
    }

    async disconnect() {
        console.debug('func(WebWallet): disconnect');
        this._connected = false;
        this._selected = false;
        this._loaded = false;

        this.emitter.emit('disconnect');
        console.debug('Web Wallet disconnected');
        // notify({
        //   message: 'Disconnected',
        //   description: '',
        //   type: 'info'
        // });
    }

    async signTransaction(transaction: Transaction): Promise<Transaction> {
        if (!this.connected) {
            throw new Error('Wallet not connected');
        }
        if (!this.selected) {
            throw new Error('Wallet not selected');
        }
        if (!this._keypair) {
            throw new Error('No keypairs found!');
        }

        const { keypair } = getNativeKeyPairFromPrivateKey(
            ChainNetworks.SOL,
            this._keypair?.privateKey ?? ''
        ) as SolanaKeys;

        console.debug('transaction', transaction);
        return new Promise<Transaction>((resolve /*reject*/) => {
            const transactionBuffer = transaction.serializeMessage();
            const signature = encodeBs58(nacl.sign.detached(transactionBuffer, keypair?.secretKey));
            console.debug('transactionBuffer', transactionBuffer);
            console.debug('signature', signature);

            transaction.addSignature(keypair?.publicKey, decodeBs58(signature));
            resolve(transaction);
        });
    }

    async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
        if (!this.connected) {
            throw new Error('Wallet not connected');
        }

        if (!this.selected) {
            throw new Error('Wallet not selected');
        }

        const _txs = transactions.map((transaction) => {
            return this.signTransaction(transaction);
        });
        return await Promise.all(_txs);
    }

    async signMessage(
        data: Uint8Array,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        display: 'hex' | 'utf8' = 'utf8'
    ): Promise<Uint8Array> {
        if (!this.connected) {
            throw new Error('Wallet not connected');
        }

        if (!this.selected) {
            throw new Error('Wallet not selected');
        }

        return data;
    }

    async sign(data: Uint8Array, display: 'hex' | 'utf8' = 'utf8'): Promise<Uint8Array> {
        return await this.signMessage(data, display);
    }
}
