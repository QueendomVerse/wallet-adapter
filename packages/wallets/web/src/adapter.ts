import { EventEmitter as Emitter } from 'eventemitter3';
import {
  type Connection,
  type PublicKey,
  type Transaction,
  Keypair,
  type TransactionSignature
} from '@solana/web3.js';
import bs58 from 'bs58';


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
  WalletConnectionError
} from '@solana/wallet-adapter-base';


import { WebWallet } from './wallet';


export interface WebWalletAdapterConfig {
  name?: string;
  network?: WalletAdapterNetwork;
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
    this._autoConnect = false;
    this._label = null;
    this._selecting = false;
    this._connecting = false;
    this._disconnecting = false;
    this._keyPair = null;
    this._publicKey = null;
    this._secretKey = null;
    this._wallet = null;
    this._readyState = typeof window === 'undefined'
      ? WalletReadyState.Unsupported
      : WalletReadyState.Loadable;
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

  public async connect(
    chain?: string,
    label?: string,
    privateKey?: string
    ): Promise<void> {
    console.error(`WebWalletAdapter(connect): Connecting to '${chain}' wallet ${label}`);
    // console.warn('WebWalletAdapter(privateKey): ', privateKey)
    if (this.connected || this.connecting) return;

    if (!chain || !label || !privateKey) {
      // console.error(`Parameters not provided! '${chain}' '${label}' '${privateKey && bs58.encode(privateKey)}'`)
      console.error(`Parameters not provided! '${chain}' '${label}' '${privateKey}'`)
      // throw error?
      // return;
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



    // let wallet: WebWallet | null
    // try {
    //   console.error('Creating WebWallet');
    //   wallet = new WebWallet({ network: this._config.network });
    // } catch (error: any) {
    //   this._connecting = false;
    //   throw new WalletConfigError(
    //     `Unable to create a wallet for(${this.name})!`
    //   );
    // }
    // if (!wallet) {
    //   this._connecting = false;
    //   throw new WalletConfigError(
    //     `Unable to config a wallet for(${this.name})!`
    //   );
    // }


    try {
      if (!this._wallet) {
        this._wallet = new WebWallet({ network: this._config.network });
      }
      const wallet = this._wallet;

      this._connecting = true;

      if (!privateKey) {
        this._connecting = false;
        throw new WalletPrivateKeyError(`No private keys provided!`);
      }
      const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
      // this._keyPair = Keypair.fromSecretKey(privateKey)
      if (!keypair) {
        this._connecting = false;
        throw new WalletKeypairError(`Unable to create a keypair!`);
      }
      this._keyPair = keypair
      this._publicKey = keypair.publicKey
      this._secretKey = keypair.secretKey

      // let wallet: WebWallet | null
      // try {
      //   console.error('Creating WebWallet');
      //   wallet = new WebWallet({ network: this._config.network });
      // } catch (error: any) {
      //   this._connecting = false;
      //   throw new WalletConfigError(
      //     `Unable to create a wallet for(${this.name})!`
      //   );
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

      console.error('wallet.loaded?', wallet.loaded)
      if (!wallet.loaded) {
        try {
          console.error('loading the webwallet database');
          await wallet.loadDb();
        } catch (error: any) {
          // console.error(`WebWallet Loading Error: ${error?.message}`);
          // throw new WalletConnectionError(error?.message, error);
          this._connecting = false;
          throw new WalletLoadError(
            `Web Wallet Adapter(${wallet.name}) Loading Error: ${error?.message}`
          );
        }
      }

      console.error('wallet.selected?', wallet.selected, chain, privateKey)
      if (!wallet.selected && chain && privateKey) {
        try {
          console.error('Selecting database webwallet', this.name);
          // await this.select(chain, privateKey, false); // @phillip: Never a good reason for this to be true
          await wallet.select(this.name);
        } catch (error: any) {
          // console.error(`WebWallet Selection Error: ${error?.message}`);
          // return;
          // throw new WalletConnectionError(error?.message, error);
          this._connecting = false;
          throw new WalletSelectionError(
            `Web Wallet Adapter(${wallet.name}) Selection Error: ${error?.message}`
          );
        }
      }

      console.error('wallet.connected?', wallet.connected, wallet.publicKey?.toBase58())
      // if (!wallet.connected && wallet.publicKey) {
      if (!wallet.connected) {
        try {
          console.error(`connecting to webwallet: ${wallet.publicKey}`);
          await wallet.connect(
            chain, label, bs58.decode(privateKey)
          );
        } catch (error: any) {
          // console.error(`WebWallet Connection Error: ${error?.message}`);
          // throw new WalletConnectionError(error?.message);
          this._connecting = false;
          throw new WalletConnectionError(
            `Unable to establish a connection for wallet (${this.name})!`
          );
        }
      }

      // console.error('wallet.selected', wallet.selected, chain, privateKey)
      // if (!wallet.selected && chain && privateKey) {
      //   try {
      //     console.error('Selecting database webwallet');
      //     await this.select(chain, privateKey, false); // @phillip: Never a good reason for this to be true
      //   } catch (error: any) {
      //     // console.error(`WebWallet Selection Error: ${error?.message}`);
      //     return;
      //     // throw new WalletConnectionError(error?.message, error);
      //   }
      // }

      // if (!wallet?.publicKey) throw new WalletConnectionError();
      if (!wallet.publicKey) {
        throw new WalletPublicKeyError(
          `No Public key found for Web Wallet Adapter(${wallet.name})!`
        );
      }

      // let publicKey: PublicKey;
      // try {
      //   const keyBytes = wallet?.publicKey;
      //   publicKey = new PublicKey(keyBytes!);
      // } catch (error: any) {
      //   // throw new WalletPublicKeyError(error?.message, error);
      //   // console.error(`No wallet public key: ${error} !`);
      //   // return;
      //   throw new WalletPublicKeyError(
      //     `Web Wallet Adapter(${wallet.name}) Public Key Error: ${error}`
      //   );
      // }

      console.error(this._wallet.connected, this._wallet.publicKey?.toBase58(), label)
      if (this._wallet.connected && this._wallet.publicKey && label != 'primary') {
        console.error(`Web Wallet connected (common): ${this.name}`);
        const base58 = this._wallet.publicKey.toBase58();

        const keyToDisplay =
          base58.length > 20
            ? `${base58.substring(0, 7)}.....${base58.substring(
                base58.length - 7,
                base58.length,
              )}`
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
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    } finally {
      this._connecting = false;
    }

    console.debug('Web Wallet loaded, connected and selected');
  }

  public async disconnect(): Promise<void> {
    console.error('WebWalletAdapter(disconnect)')
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
        } catch (error: any) {
          console.error(`WebWallet Disconnection Error: ${error?.message}`);
          // this.emit('error', new WalletDisconnectionError(error?.message, error));
        }
      }
    } catch (error: any) {
      this.emit('error', new WalletDisconnectionError(error?.message, error));
    } finally {
      this._disconnecting = false;
    }
    console.info('Web Wallet disconnected');
  }

  // public async select(
  //   chain?: string,
  //   privateKey?: string,
  //   // force?: boolean,
  // ): Promise<void> {
  //   console.error('WebWalletAdapter(select)')
  //   try {
  //     // if (this.selected || this.selecting) return;
  //     if (this._readyState !== WalletReadyState.Loadable) {
  //       throw new WalletNotReadyError('Wallet is not ready!');
  //     }
      
  //     // this._readyState = WalletReadyState.Installed;

  //     this._selecting = true;

  //     const wallet = this._wallet;
  //     if (!wallet) {
  //       console.error('Selection Error: Unable to load the WebWallet');
  //       return;
  //     }

  //     // if (!wallet.connected) {
  //     //   console.error('Selection Error: Wallet is not connected');
  //     //   return;
  //     // }

  //     if (!wallet.selected && chain && privateKey) {
  //       try {
  //         console.debug('Selecting database webwallet');
  //         // await wallet.selectWallet(chain, privateKey, force);
  //         await wallet.selectWallet(chain, privateKey);
  //       } catch (error: any) {
  //         console.error(`WebWallet Selection Error: ${error?.message}`);
  //         return;
  //         // throw new WalletConnectionError(error?.message, error);
  //       }
  //     }
  //   } catch (error: any) {
  //     // this.emit('error', new WalletDisconnectionError(error?.message, error));
  //     console.error(`Web Wallet Selection failed: ${error} !`);
  //     return;
  //   } finally {
  //     this._selecting = false;
  //   }
  //   console.info('Web Wallet selected');
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
					this.emit('error', error);
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
      this.emit('error', error);
      throw error;
    }
  }

  public async signAllTransactions(
    transactions: Transaction[],
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
      this.emit('error', error);
      throw error;
    }
  }

  public async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        return await wallet?.signMessage(message, 'utf8');
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error);
      }
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    }
  }
}
