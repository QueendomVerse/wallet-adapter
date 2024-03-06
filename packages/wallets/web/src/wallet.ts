import { EventEmitter as Emitter } from 'eventemitter3';
// import type { Cluster } from '@solana/web3.js';
// import { type ChainConnection, type ChainPublicKey, type ChainTransaction, SolanaKeypair, type TransactionSignature } from '@solana/web3.js';
import { decode as decodeBase58 } from 'bs58';

import {
    // AdapterEvents,
    BaseMessageSignerWalletAdapter,
    type SendTransactionOptions,
    // BaseWalletAdapter,
    type WalletName,
    WalletReadyState,
    WalletError,
    // WalletDisconnectedError,
    WalletSendTransactionError,
    WalletDisconnectionError,
    WalletNotConnectedError,
    WalletSelectionError,
    WalletConfigError,
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
    SolanaKeypair,
    ChainTickers,
    WalletAdapter,
} from '@mindblox-wallet-adapter/base';

// import type { PhantomWalletAdapter } from '@mindblox-wallet-adapter/phantom';
import type {
    Adapter,
    ChainConnection,
    ChainPublicKey,
    ChainTransaction,
    ChainTransactionSignature,
    Wallet,
    ChainTicker,
    SolanaTransaction,
    Chain,
} from '@mindblox-wallet-adapter/base';
import type {
    ChainAdapter,
    ChainAdapterNetwork,
    ChainAdapterNetworks} from '@mindblox-wallet-adapter/networks';
import {
    ChainConnectionFactory,
    ChainKeypairFactory,
    ChainPublicKeyFactory,
    CommonAdapterNetwork,
    NearBrowserWalletAdapter,
} from '@mindblox-wallet-adapter/networks';
import { getAdapterNetwork, getKeyPairFromPrivateKey } from '@mindblox-wallet-adapter/networks';

import { DEFAULT_NETWORK, DEFAULT_TICKER } from './constants';
import { SolanaAdapter } from '@mindblox-wallet-adapter/solana';
import { NearAdapter } from '@mindblox-wallet-adapter/near';

import { encode as encodeBase58} from 'bs58';
import nacl from 'tweetnacl';
import React from 'react';
import type { Unsubscribe } from 'redux';

import type {
    ChainKeypair,
    LocalKeypairStore,
    LocalWalletStore,
} from '@mindblox-wallet-adapter/base';
import { notify } from '@mindblox-wallet-adapter/react';

import type {
    IndexDbAppDatabase,
    IndexDbWallet,
    // User as IndexDbUser
} from './indexDb';
// import { getSavedIndexDbWallets, updateIndexDbWallet } from './indexDb';
import { store } from './store';


export interface WebWalletAdapterConfig {
    name?: WalletName;
    chain: ChainTicker;
    network: ChainAdapterNetwork;
}

export type EndpointMap = {
    name: WalletName;
    chain: ChainTicker;
    network: ChainAdapterNetwork | null;
};

export const getEndpointMap = (chain: ChainTicker, network: ChainAdapterNetworks): EndpointMap => ({
    name: 'WebWallet' as WalletName,
    chain,
    network: getAdapterNetwork(chain, network),
});

// interface Notification {
//     message: string;
//     description: string;
// }

export type ExtendedWebAdapter =
    | WebWalletAdapter
    | ChainAdapter
    // | SolanaAdapter
    // | NearAdapter
    // | NearBrowserWalletAdapter
    // | PhantomWalletAdapter
    // | WalletAdapter<ChainPublicKey, ChainTransaction, ChainConnection, ChainTransactionSignature>;

export interface ExtendedWallet
    extends Wallet<ChainPublicKey, ChainTransaction, ChainConnection, ChainTransactionSignature> {
    adapter?: ExtendedWebAdapter;
    readyState: WalletReadyState;
}

// export const WebWalletName = 'WebWallet' as WalletName;

export class WebWalletAdapter extends BaseMessageSignerWalletAdapter<
    ChainPublicKey,
    WalletError,
    ChainTransaction,
    ChainConnection,
    ChainTransactionSignature
> {
    // export class WebWalletAdapter extends BaseWalletAdapter {
    private readonly _emitter = new Emitter();

    public chain: ChainTicker;
    public name: WalletName;
    public network: ChainAdapterNetwork;
    url = 'https://chiefmetaverse.co';
    public icon =
        'data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDQ3LjUgNDcuNSIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDcuNSA0Ny41OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgdmVyc2lvbj0iMS4xIiBpZD0ic3ZnMiI+PGRlZnMgaWQ9ImRlZnM2Ij48Y2xpcFBhdGggaWQ9ImNsaXBQYXRoMTYiIGNsaXBQYXRoVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBpZD0icGF0aDE4IiBkPSJNIDAsMzggMzgsMzggMzgsMCAwLDAgMCwzOCBaIi8+PC9jbGlwUGF0aD48L2RlZnM+PGcgdHJhbnNmb3JtPSJtYXRyaXgoMS4yNSwwLDAsLTEuMjUsMCw0Ny41KSIgaWQ9ImcxMCI+PGcgaWQ9ImcxMiI+PGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXBQYXRoMTYpIiBpZD0iZzE0Ij48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzNyw1KSIgaWQ9ImcyMCI+PHBhdGggaWQ9InBhdGgyMiIgc3R5bGU9ImZpbGw6IzNiODhjMztmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZSIgZD0ibSAwLDAgYyAwLC0yLjIwOSAtMS43OTEsLTQgLTQsLTQgbCAtMjgsMCBjIC0yLjIwOSwwIC00LDEuNzkxIC00LDQgbCAwLDI4IGMgMCwyLjIwOSAxLjc5MSw0IDQsNCBsIDI4LDAgYyAyLjIwOSwwIDQsLTEuNzkxIDQsLTQgTCAwLDAgWiIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyNC4wODc5LDE1LjA2OTMpIiBpZD0iZzI0Ij48cGF0aCBpZD0icGF0aDI2IiBzdHlsZT0iZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTpub25lIiBkPSJtIDAsMCBjIDAuNTI2LDEuMTc5IDAuNzQ0LDIuNTQyIDAuNzQ0LDMuOTY5IDAsMy42ODkgLTEuOTU0LDcuMTMxIC01LjgyOSw3LjEzMSAtMy44NzYsMCAtNS44MywtMy4zNzkgLTUuODMsLTcuMTMxIDAsLTMuNzgyIDEuODkyLC03LjEzMiA1LjgzLC03LjEzMiAwLjcxMiwwIDEuMzY0LDAuMDk0IDEuOTgzLDAuMjE4IGwgLTEuMTE1LDEuMDg1IGMgLTAuMzQyLDAuMzEgLTAuNTksMC44MDYgLTAuNTksMS4yNCAwLDEuMjA5IDAuODM4LDIuMjMyIDIuMTA5LDIuMjMyIDAuNDM0LDAgMC44MDUsLTAuMTU1IDEuMTc4LC0wLjQwMyBMIDAsMCBaIG0gMC4zNzEsLTYuMDc3IGMgLTEuNTE5LC0wLjg2OCAtMy4zNDgsLTEuMzY0IC01LjQ1NiwtMS4zNjQgLTYuMjk1LDAgLTEwLjY2Niw0Ljk5MiAtMTAuNjY2LDExLjQxIDAsNi40NDkgNC4zNCwxMS40MSAxMC42NjYsMTEuNDEgNi4yMzEsMCAxMC42NjUsLTUuMTE2IDEwLjY2NSwtMTEuNDEgMCwtMi43MjkgLTAuNzEzLC01LjIwOSAtMi4wNzgsLTcuMTYyIGwgMS43NjgsLTEuNTIgYyAwLjU4OSwtMC41MjcgMS4wODUsLTEuMDIzIDEuMDg1LC0xLjg5MSAwLC0xLjA4NSAtMS4wODUsLTEuOTU0IC0yLjEzOCwtMS45NTQgLTAuNjg0LDAgLTEuMjQsMC4yOCAtMi4wNzgsMC45OTMgbCAtMS43NjgsMS40ODggeiIvPjwvZz48L2c+PC9nPjwvZz4KCQoJPG1ldGFkYXRhPgoJCTxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIgeG1sbnM6cmRmcz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wMS9yZGYtc2NoZW1hIyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIj4KCQkJPHJkZjpEZXNjcmlwdGlvbiBhYm91dD0iaHR0cHM6Ly9pY29uc2NvdXQuY29tL2xlZ2FsI2xpY2Vuc2VzIiBkYzp0aXRsZT0iUSwgQ2hhcmFjdGVycywgQ2hhcmFjdGVyLCBBbHBoYWJldCwgTGV0dGVyIiBkYzpkZXNjcmlwdGlvbj0iUSwgQ2hhcmFjdGVycywgQ2hhcmFjdGVyLCBBbHBoYWJldCwgTGV0dGVyIiBkYzpwdWJsaXNoZXI9Ikljb25zY291dCIgZGM6ZGF0ZT0iMjAxNi0xMi0xNCIgZGM6Zm9ybWF0PSJpbWFnZS9zdmcreG1sIiBkYzpsYW5ndWFnZT0iZW4iPgoJCQkJPGRjOmNyZWF0b3I+CgkJCQkJPHJkZjpCYWc+CgkJCQkJCTxyZGY6bGk+VHdpdHRlciBFbW9qaTwvcmRmOmxpPgoJCQkJCTwvcmRmOkJhZz4KCQkJCTwvZGM6Y3JlYXRvcj4KCQkJPC9yZGY6RGVzY3JpcHRpb24+CgkJPC9yZGY6UkRGPgogICAgPC9tZXRhZGF0YT48L3N2Zz4K';

    private _activeNotification: boolean;
    private _config: WebWalletAdapterConfig;
    private _chain: Chain | null;
    private _autoConnect: boolean;
    private _label: string | null;
    private _selecting: boolean;
    private _connecting: boolean;
    private _disconnecting: boolean;
    private _keyPair: SolanaKeypair | null;
    private _publicKey: ChainPublicKey | null;
    private _secretKey: Uint8Array | null;
    private _wallet: WebWallet | null;
    private _readyState: WalletReadyState;
    private _db: IndexDbAppDatabase;

    constructor(config: WebWalletAdapterConfig, indexDb: IndexDbAppDatabase) {
        super();
        this._config = config;
        this._db = indexDb

        this.name = this.config.name ?? ('WebWallet' as WalletName);

        const network = this._config.network ?? getAdapterNetwork(DEFAULT_TICKER, DEFAULT_NETWORK);
        if (!network) {
            throw new Error("Unable to set the web wallet's network");
        }

        this.network = network

        this._activeNotification = false;
        this._chain = null;
        this._autoConnect = false;
        this._label = null;
        this._selecting = false;
        this._connecting = false;
        this._disconnecting = false;
        this._keyPair = null;
        this._publicKey = null;
        this._secretKey = null;
        this._wallet = null;
        this._readyState = typeof window === 'undefined' ? WalletReadyState.Unsupported : WalletReadyState.Loadable;
        this.chain = ChainTickers.SOL;
    }

    private _disconnected = () => {
        const wallet = this._wallet;
        if (wallet) {
            wallet?.emitter.off('disconnect', this._disconnected);

            this._publicKey = null;

            // this.emit('error', new WalletDisconnectedError('Failed to Disconnect'));
            this.emit('disconnect');
        }
    };

    get config(): WebWalletAdapterConfig {
        return this._config;
    }

    get autoConnect(): boolean {
        return this._autoConnect;
    }

    // get chain(): ChainTicker {
    //     return this._chain;
    // }

    get label(): string | null {
        return this._label;
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

    get keyPair(): SolanaKeypair | null {
        return this._keyPair;
    }

    get publicKey(): ChainPublicKey | null {
        return this._publicKey;
    }

    get secretKey(): Uint8Array | null {
        return this._secretKey;
    }

    get readyState(): WalletReadyState {
        return this._readyState;
    }

    public async setCredentials(chain: Chain, label: string, privateKey: string): Promise<void> {
        console.debug(`WebWalletAdapter(setCrentials): Setting credentials for '${chain}' wallet ${label}`);
        this._label = label;
        this._secretKey = new Uint8Array(JSON.parse(privateKey));
        this._publicKey = SolanaKeypair.fromSecretKey(this._secretKey).publicKey;
        this._keyPair = SolanaKeypair.fromSecretKey(this._secretKey);
    }

    public async connect(chain?: Chain, label?: string, privateKey?: string): Promise<void> {
        console.debug(`WebWalletAdapter(connect): Connecting to '${chain}' wallet ${label}`);
        // console.warn('WebWalletAdapter(privateKey): ', privateKey)
        if (this.connected || this.connecting) return;

        if (!chain || !label || !privateKey) {
            console.error(`Parameters not provided! '${chain}' '${label}' '${privateKey}'`);
            // throw error?
            // return;
        }

        if (
            this._readyState !== WalletReadyState.Loadable
            // || this._readyState !== WalletReadyState.Installed
        ) {
            throw new WalletNotReadyError(`Web Wallet Adapter(${this.name}) Not Ready!`);
        }

        if (!this._config) {
            throw new WalletConfigError(`Configuration not defined for Web Wallet Adapter(${this.name})!`);
        }

        // let wallet: WebWallet | null
        // try {
        //     console.debug('Creating WebWallet');
        //     wallet = new WebWallet({ network: this._config.network });
        // } catch (error) {
        //     this._connecting = false;
        //     throw new WalletConfigError(`Unable to create a wallet for(${this.name})!`);
        // }
        // if (!wallet) {
        //   this._connecting = false;
        //   throw new WalletConfigError(
        //     `Unable to config a wallet for(${this.name})!`
        //   );
        // }

        try {
            //@TODO: change to default network
            if (!this._wallet) {
                this._wallet = new WebWallet(this.config, {}, this._db);
            }
            const wallet = this._wallet;

            this._connecting = true;

            if (!privateKey) {
                this._connecting = false;
                throw new WalletPrivateKeyError(`No private keys provided!`);
            }
            const keypair = SolanaKeypair.fromSecretKey(decodeBase58(privateKey));
            // this._keyPair = SolanaKeypair.fromSecretKey(privateKey)
            if (!keypair) {
                this._connecting = false;
                throw new WalletKeypairError(`Unable to create a keypair!`);
            }
            this._keyPair = keypair;
            this._publicKey = keypair.publicKey;
            this._secretKey = keypair.secretKey;

            // try {
            //     console.debug('Creating WebWallet');
            //     wallet = new WebWallet({ network: this._config.network });
            // } catch (error) {
            //     this._connecting = false;
            //     throw new WalletConfigError(`Unable to create a wallet for(${this.name})!`);
            // }
            // if (!wallet) {
            //   this._connecting = false;
            //   throw new WalletConfigError(
            //     `Unable to config a wallet for(${this.name})!`
            //   );
            // }

            // const wallet = this._wallet;
            // if (!wallet) {
            //   console.error('Connect Error: Unable to load the WebWallet');
            //   return;
            // }

            console.debug('wallet.loaded?', wallet.loaded);
            if (!wallet.loaded) {
                try {
                    console.debug('loading the webwallet database');
                    await wallet.loadDb();
                } catch (error) {
                    const errMsg =
                        error instanceof Error
                            ? `Web Wallet Adapter(${wallet.name}) Loading Error: ${error?.message}`
                            : `WebWallet Loading Error: ${error}`;
                    this._connecting = false;
                    throw error instanceof Error ? new WalletLoadError(errMsg) : console.error(errMsg);
                }
            }

            if (!wallet.selected && chain && privateKey) {
                try {
                    console.debug('Selecting database webwallet', this.name);
                    await wallet.select(this.name);
                } catch (error) {
                    this._connecting = false;
                    const errMsg =
                        error instanceof Error
                            ? `Web Wallet Adapter(${wallet.name}) Selection Error: ${error.message}`
                            : `Web Wallet Adapter Selection Error: ${error}`;
                    throw error instanceof Error ? new WalletSelectionError(errMsg) : console.error(errMsg);
                }
            }

            console.debug('wallet.connected?', wallet.connected, wallet.publicKey?.toBase58());
            // if (!wallet.connected && wallet.publicKey) {
            if (!wallet.connected) {
                try {
                    console.debug(`connecting to webwallet: ${wallet.publicKey}`);
                    await wallet.connect(chain, label, decodeBase58(privateKey));
                } catch (error) {
                    this._connecting = false;
                    const errMsg =
                        error instanceof Error
                            ? `Unable to establish a connection for wallet (${this.name})!: ${error.message}`
                            : `Unable to establish a connection for wallet (${this.name})!`;
                    throw error instanceof Error ? new WalletConnectionError(errMsg) : console.error(errMsg);
                }
            }

            // if (!wallet.selected && chain && privateKey) {
            //     try {
            //         console.debug('Selecting database webwallet');
            //         await this.select(chain, privateKey, false);
            //     } catch (error) {
            //         if (error instanceof Error) {
            //             console.error(`WebWallet Selection Error: ${error.message}`);
            //         }
            //         return;
            //     }
            // }

            // if (!wallet?.publicKey) throw new WalletConnectionError();
            if (!wallet.publicKey) {
                throw new WalletPublicKeyError(`No Public key found for Web Wallet Adapter(${wallet.name})!`);
            }
            let publicKey: ChainPublicKey;

            // try {
            //     const keyBytes = wallet?.publicKey;
            //     publicKey = new ChainPublicKey(keyBytes!);
            // } catch (error) {
            //     let errMsg = error instanceof Error
            //         ? `Web Wallet Adapter(${wallet.name}) Public Key Error: ${error.message}`
            //         : `Web Wallet Adapter Public Key Error: ${error}`;
            //     throw error instanceof Error ? new WalletPublicKeyError(errMsg) : console.error(errMsg);
            // }

            console.debug(this._wallet.connected, this._wallet.publicKey?.toBase58(), label);
            if (this._wallet.connected && this._wallet.publicKey && label != 'primary') {
                console.debug(`Web Wallet connected (common): ${this.name}`);
                const base58 = this._wallet.publicKey.toBase58();

                const keyToDisplay =
                    base58.length > 20
                        ? `${base58.substring(0, 7)}.....${base58.substring(base58.length - 7, base58.length)}`
                        : base58;
                console.debug(`Web Wallet connection: ${base58}`);
            }

            //@TODO why disconnect?
            // wallet?.on('disconnect', this._disconnected);
            wallet?.emitter.on('disconnect', this._disconnected);
            this._emitter.on('disconnect', this._disconnected);

            this._wallet = wallet;
            // this._publicKey = publicKey!;

            // this.emit('connect', publicKey!);
            this.emit('connect', keypair.publicKey);
        } catch (error) {
            const walletError =
                error instanceof WalletError
                    ? error
                    : new WalletError(error instanceof Error ? error.message : 'Unknown error occurred');
            this.emit('error', walletError);
            this._connecting = false;
            throw walletError;
        } finally {
            this._connecting = false;
        }

        console.debug('Web Wallet loaded, connected and selected');
    }

    public async disconnect(): Promise<void> {
        console.debug('WebWalletAdapter(disconnect)');
        try {
            if (this.disconnected || this.disconnecting) return;

            this._disconnecting = true;
            const wallet = this._wallet;

            if (!wallet) {
                console.error('Disconnect Error: Unable to load the WebWallet');
                this._disconnecting = false;
                return;
            }

            if (wallet.connected) {
                console.debug('Disconnecting Web Wallet ...');
                wallet?.emitter.off('disconnect', this._disconnected);

                this._publicKey = null;

                try {
                    await wallet.disconnect();
                    this.emit('disconnect');

                    // Reset notification display
                    this._activeNotification = false;
                    this._wallet = wallet;
                } catch (error) {
                    const errMsg =
                        error instanceof Error
                            ? `WebWallet Disconnection Error: ${error.message}`
                            : `WebWallet Disconnection Error: ${error}`;

                    if (error instanceof Error) {
                        console.error(errMsg);
                        this.emit('error', new WalletDisconnectionError(error.message));
                    } else {
                        console.error(errMsg);
                    }
                }
            }
        } catch (error) {
            const walletError =
                error instanceof Error
                    ? new WalletDisconnectionError(error.message, error)
                    : new WalletDisconnectionError('An error occurred during disconnection', error);
            this.emit('error', walletError);
        } finally {
            this._disconnecting = false;
        }
        console.info('Web Wallet disconnected');
    }

    // public async select(
    //     chain?: Chain,
    //     privateKey?: string
    //     // force?: boolean,
    // ): Promise<void> {
    //     console.debug('WebWalletAdapter(select)');
    //     try {
    //         // if (this.selected || this.selecting) return;
    //         if (this._readyState !== WalletReadyState.Loadable) {
    //             throw new WalletNotReadyError('Wallet is not ready!');
    //         }

    //         // this._readyState = WalletReadyState.Installed;

    //         this._selecting = true;

    //         const wallet = this._wallet;
    //         if (!wallet) {
    //             console.error('Selection Error: Unable to load the WebWallet');
    //             return;
    //         }

    //         // if (!wallet.connected) {
    //         //   console.error('Selection Error: Wallet is not connected');
    //         //   return;
    //         // }

    //         if (!wallet.selected && chain && privateKey) {
    //             try {
    //                 console.debug('Selecting database webwallet');
    //                 await wallet.selectWallet(chain, privateKey);
    //             } catch (error) {
    //                 let errMsg =
    //                     error instanceof Error
    //                         ? `WebWallet Selection Error: ${error.message}`
    //                         : `WebWallet Selection Error: ${error}`;
    //                 console.error(errMsg);
    //                 return;
    //             }
    //         }
    //     } catch (error) {
    //         let errMsg =
    //             error instanceof Error
    //                 ? `Web Wallet Selection failed: ${error.message} !`
    //                 : `Web Wallet Selection failed: ${error} !`;
    //         console.error(errMsg);
    //         return;
    //     } finally {
    //         this._selecting = false;
    //     }
    //     console.info('Web Wallet selected');
    // }

    // public sendTransaction = async (
    //     transaction: SolanaTransaction,
    //     connection: SolanaConnection,
    //     options: SendTransactionOptions<SolanaSigner, SolanaTransactionSignature> = {}
    // ): Promise<TransactionSignature> => {
    //     let emit = true;
    //     try {
    //         try {
    //             transaction = await this.prepareTransaction(transaction, connection) as SolanaTransaction;

    //             const { signers, sendOptions } = options;
    //             signers?.length && transaction.partialSign(...signers);

    //             transaction = await this.signTransaction(transaction) as SolanaTransaction;

    //             const rawTransaction = transaction.serialize();

    //             return await connection.sendRawTransaction(rawTransaction, sendOptions);
    //         } catch (error) {
    //             // If the error was thrown by `signTransaction`, rethrow it and don't emit a duplicate event
    //             const errMsg = error instanceof Error ? error.message : 'Unknown error occurred';

    //             if (error instanceof WalletSignTransactionError) {
    //                 emit = false;
    //                 throw error;
    //             }

    //             throw new WalletSendTransactionError(errMsg, error);
    //         }
    //     } catch (error) {
    //         if (emit) {
    //             const walletError =
    //                 error instanceof WalletError
    //                     ? error
    //                     : new WalletError(error instanceof Error ? error.message : 'Unknown error occurred');
    //             this.emit('error', walletError);
    //         }

    //         throw error;
    //     }
    // }

    public async signTransaction(transaction: ChainTransaction): Promise<ChainTransaction> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new WalletNotConnectedError();

            try {
                return (await wallet?.signTransaction(transaction)) || transaction;
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : 'Error on transaction signing';
                throw new WalletSignTransactionError(errMsg, error);
            }
        } catch (error) {
            const walletError =
                error instanceof WalletError
                    ? error
                    : new WalletError(error instanceof Error ? error.message : 'Unknown error occurred');
            this.emit('error', walletError);
            throw walletError;
        }
    }

    public async signAllTransactions(transactions: SolanaTransaction[]): Promise<ChainTransaction[]> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new WalletNotConnectedError();

            try {
                return (await wallet?.signAllTransactions(transactions)) || transactions;
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : 'Error on transactions signing';
                throw new WalletSignTransactionError(errMsg, error);
            }
        } catch (error) {
            const walletError =
                error instanceof WalletError
                    ? error
                    : new WalletError(error instanceof Error ? error.message : 'Unknown error occurred');
            this.emit('error', walletError);
            throw walletError;
        }
    }

    public async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new WalletNotConnectedError();

            try {
                return await wallet?.signMessage(message, 'utf8');
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : 'Error on message signing';
                throw new WalletSignTransactionError(errMsg, error);
            }
        } catch (error) {
            const walletError =
                error instanceof WalletError
                    ? error
                    : new WalletError(error instanceof Error ? error.message : 'Unknown error occurred');
            this.emit('error', walletError);
            throw walletError;
        }
    }
}

interface WebWalletProps {
    focus?: boolean;
}
interface WebWalletState {
    wallets: LocalWalletStore[];
}

export class WebWallet extends React.Component<WebWalletProps, WebWalletState, WebWalletEmitter> {
    public readonly emitter = new Emitter();
    public adapter: WebWalletAdapter | null = null;
    public wallets: IndexDbWallet[] | null;

    private _connection: ChainConnection | null = null;
    private _config: WebWalletAdapterConfig;
    private _name: WalletName | null;
    private _keypair: LocalKeypairStore | null;
    private _loaded: boolean;
    private _selected: boolean;
    private _connected: boolean;
    private _db: IndexDbAppDatabase;

    // private _dbWallets: IndexDbWallet[] | null;
    private unsubscribeStore: Unsubscribe | null;

    constructor(config: WebWalletAdapterConfig, props: WebWalletProps, indexDb: IndexDbAppDatabase) {
        super(props);
        this._config = config;

        this._db =  indexDb

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
        if (this.chain && this.network) {
            this._connection = ChainConnectionFactory.createConnection<ChainConnection>(
                this.chain, this.network
            );
        }
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

                    const result = await this._db.updateWallet(_updatedWallet)
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
        const _wallets = await this._db.getSavedWallets();
        this.wallets = _wallets || [];
        this._loaded = Boolean(_wallets);
        return _wallets;
    };

    _loadDbWallet = async (chain: Chain, privateKey: string) => {
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
        // const keypairs: LocalKeypairStore[] = this.wallets?.filter(({seed}) => seed).map(({seed}) => Keypair.fromSeed(Buffer.from(seed)));

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

    _loadSelectedDbWallet = async (chain: Chain, privateKey: string, force?: boolean) => {
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

    get publicKey(): ChainPublicKey | null {
        if (!this.chain || !this._keypair?.publicKey) return null;
        return (
            this.secretKey && ChainPublicKeyFactory.createPublicKey<ChainPublicKey>(this.chain, this._keypair.publicKey)
        );
    }

    get secretKey(): Uint8Array | null {
        if (!this._keypair || !this._keypair.privateKey) return null;
        return decodeBase58(this._keypair.privateKey);
    }

    get keypair(): ChainKeypair | null {
        if (!this.chain || !this.secretKey) return null;
        return this.secretKey && ChainKeypairFactory.createKeypair<ChainKeypair>(this.chain, this.secretKey);
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

    get chain() {
        return this._config.chain;
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

    // async selectWallet(chain: Chain, privateKey: string, force?: boolean) {
    async selectWallet(chain: Chain, privateKey: string) {
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

        // let keypair: LocalKeypairStore | undefined;
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

        // let keypair: LocalKeypairStore | undefined;
        // if (this.loaded && this.wallets && chain && label && privateKey) {
        //   const walletName = `${capitalizeFirst(chain)}${capitalizeFirst(label)}WebWallet` as WalletName;

        //   console.debug(
        //     privateKey ? 'loading keypair ...' : 'loading selected ...',
        //   );
        //   keypair = privateKey
        //     ? await this._loadDbWallet(chain, encodeBase58(privateKey))
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

    async connect(chain?: Chain, label?: string, privateKey?: Uint8Array, force?: boolean) {
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

        let keypair: LocalKeypairStore | undefined;
        if (this.loaded && this.wallets && chain && privateKey) {
            keypair = privateKey
                ? // ? await this._loadDbWallet(chain, privateKey)
                  // : await this._loadSelectedDbWallet(chain, privateKey, force);
                  await this._loadDbWallet(chain, encodeBase58(privateKey))
                : await this._loadSelectedDbWallet(chain, encodeBase58(privateKey), force);
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

    async signTransaction(transaction: ChainTransaction): Promise<ChainTransaction> {
        if (!this.connected) {
            throw new Error('Wallet not connected');
        }
        if (!this.selected) {
            throw new Error('Wallet not selected');
        }
        if (!this._keypair) {
            throw new Error('No keypairs found!');
        }

        // const { keypair } = getNativeKeyPairFromPrivateKey(
        //     ChainNetworks.SOL,
        //     this._keypair?.privateKey ?? ''
        // ) as SolanaKeys;

        console.debug('transaction', transaction);
        return new Promise<ChainTransaction>((resolve /*reject*/) => {
            if (!this.secretKey || !this.publicKey) {
                throw new Error('Unable to process transaction without keypairs');
            }
            const transactionBuffer = transaction.serializeMessage();
            const signature = encodeBase58(nacl.sign.detached(transactionBuffer, this.secretKey));
            console.debug('transactionBuffer', transactionBuffer);
            console.debug('signature', signature);

            // transaction.addSignature(this.publicKey, decodeBase58(signature));
            resolve(transaction);
        });
    }

    async signAllTransactions(transactions: ChainTransaction[]): Promise<ChainTransaction[]> {
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

export abstract class WebWalletEmitter extends Emitter {
    abstract get publicKey(): ChainPublicKey | null;
    abstract get connected(): boolean;


    // abstract connect(privateKey?: string): Promise<string | void>;
    // abstract select(
    //   walletName: WalletName,
    //   chain?: Chain,
    //   privateKey?: string
    // ): Promise<string | void>;
    abstract select(walletName: WalletName): // chain?: Chain,
    // label?: string,
    // privateKey?: Uint8Array
    Promise<string | void>;
    abstract connect(chain?: Chain, label?: string, privateKey?: Uint8Array): Promise<string | void>;
    abstract disconnect(): Promise<void>;
    abstract signTransaction(transaction: ChainTransaction): Promise<ChainTransaction>;
    abstract signAllTransactions(transactions: ChainTransaction[]): Promise<ChainTransaction[]>;
    abstract signMessage(data: Uint8Array, display: 'hex' | 'utf8'): Promise<Uint8Array>;
}

// type PromiseCallback = (...args: unknown[]) => unknown;

// type MessageHandlers = {
//   [id: string]: {
//     resolve: PromiseCallback;
//     reject: PromiseCallback;
//   };
// };
