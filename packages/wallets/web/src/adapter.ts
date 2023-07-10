import { EventEmitter as Emitter } from 'eventemitter3';
import { type Connection, type PublicKey, type Transaction, Keypair, type TransactionSignature } from '@solana/web3.js';
import { decode as decodeBs58 } from 'bs58';

import {
    // AdapterEvents,
    BaseMessageSignerWalletAdapter,
    type SendTransactionOptions,
    // BaseWalletAdapter,
    type WalletAdapterNetwork,
    type WalletName,
    WalletReadyState,
    WalletError,
    WalletDisconnectedError,
    WalletSendTransactionError,
    WalletDisconnectionError,
    WalletNotConnectedError,
    WalletSelectionError,
    WalletConfigError,
    WalletActivationError,
    WalletNotActivatedError,
    WalletLoadError,
    WalletKeypairError,
    WalletNotReadyError,
    WalletPublicKeyError,
    WalletPrivateKeyError,
    // WalletKeypairError,
    WalletSignTransactionError,
    WalletConnectionError,
} from '@base';

import { WebWallet } from './core';
import type { Chain } from './chains';

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
    // export class WebWalletAdapter extends BaseWalletAdapter {
    private readonly _emitter = new Emitter();

    public name: WalletName;
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
    private _keyPair: Keypair | null;
    private _publicKey: PublicKey | null;
    private _secretKey: Uint8Array | null;
    private _wallet: WebWallet | null;
    private _readyState: WalletReadyState;

    constructor(config: WebWalletAdapterConfig = {}) {
        super();
        this.name = (config.name ?? 'WebWallet') as WalletName;

        this._activeNotification = false;
        this._config = config;
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

    get chain(): Chain | null {
        return this._chain;
    }

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

    get keyPair(): Keypair | null {
        return this._keyPair;
    }

    get publicKey(): PublicKey | null {
        return this._publicKey;
    }

    get secretKey(): Uint8Array | null {
        return this._secretKey;
    }

    get readyState(): WalletReadyState {
        return this._readyState;
    }

    public async setCredentials(chain: string, label: string, privateKey: string): Promise<void> {
        console.debug(`WebWalletAdapter(setCrentials): Setting credentials for '${chain}' wallet ${label}`);
        this._label = label;
        this._secretKey = new Uint8Array(JSON.parse(privateKey));
        this._publicKey = Keypair.fromSecretKey(this._secretKey).publicKey;
        this._keyPair = Keypair.fromSecretKey(this._secretKey);
    }

    public async connect(chain?: string, label?: string, privateKey?: string): Promise<void> {
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
            if (!this._wallet) {
                this._wallet = new WebWallet({ network: this._config.network }, {});
            }
            const wallet = this._wallet;

            this._connecting = true;

            if (!privateKey) {
                this._connecting = false;
                throw new WalletPrivateKeyError(`No private keys provided!`);
            }
            const keypair = Keypair.fromSecretKey(decodeBs58(privateKey));
            // this._keyPair = Keypair.fromSecretKey(privateKey)
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
                    await wallet.connect(chain, label, decodeBs58(privateKey));
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
            let publicKey: PublicKey;

            // try {
            //     const keyBytes = wallet?.publicKey;
            //     publicKey = new PublicKey(keyBytes!);
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
    //     chain?: string,
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

                return await connection.sendRawTransaction(rawTransaction, sendOptions);
            } catch (error) {
                // If the error was thrown by `signTransaction`, rethrow it and don't emit a duplicate event
                const errMsg = error instanceof Error ? error.message : 'Unknown error occurred';

                if (error instanceof WalletSignTransactionError) {
                    emit = false;
                    throw error;
                }

                throw new WalletSendTransactionError(errMsg, error);
            }
        } catch (error) {
            if (emit) {
                const walletError =
                    error instanceof WalletError
                        ? error
                        : new WalletError(error instanceof Error ? error.message : 'Unknown error occurred');
                this.emit('error', walletError);
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

    public async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
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
