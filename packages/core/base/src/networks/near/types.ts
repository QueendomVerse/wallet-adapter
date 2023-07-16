import type { Near } from 'near-api-js';
import {
    Connection,
    // WalletConnection,
    KeyPair,
    Signer,
    transactions,
    utils,
    InMemorySigner,
    keyStores,
} from 'near-api-js';
import {
    SignedTransaction,
    Transaction,
    Signature as NearSignature,
    createTransaction as createNearTransaction,
    SCHEMA,
    transfer,
} from 'near-api-js/lib/transaction';
import { PublicKey } from 'near-api-js/lib/utils';
import type {
    KeyType,
    // KeyPairEd25519,
    Signature,
} from 'near-api-js/lib/utils/key_pair';
import { KeyPairEd25519 } from 'near-api-js/lib/utils/key_pair';
import { serialize, base_decode } from 'near-api-js/lib/utils/serialize';
import type { QueryResponseKind } from 'near-api-js/lib/providers/provider';
import { Provider } from 'near-api-js/lib/providers/provider';
import { JsonRpcProvider } from 'near-api-js/lib/providers';

import type { TokenAccountsFilter } from '@solana/web3.js';
import { PublicKey as NativeSolanaPublicKey } from '@solana/web3.js';
import { encode as encodeBase58, decode as decodeBase58 } from 'bs58';
import BN from 'bn.js';
import nacl from 'tweetnacl';
import { baseEncode, baseDecode } from 'borsh';

import type { Chain } from '../../chains';
import { ChainNetworks } from '../../chains';
import type { SolanaCommitment } from '../solana';
import { SolanaConnection, SolanaPublicKey, SolanaTransaction } from '../solana';
import { WalletError } from '../../errors';
import { applyMixins, removeEd25519 } from '../../utils';
import type { ChainPublicKey, IKeypair } from '../../types';

type SerializeConfig = {
    /** Require all transaction signatures be present (default: true) */
    requireAllSignatures?: boolean;
    /** Verify provided signatures (default: true) */
    verifySignatures?: boolean;
};

const MAX_GAS = '300000000000000';

export interface Gas {
    totalTokensBurned: string;
    totalGasBurned: number;
}

export interface NearTransactionInstruction {}

export type AccountInfo<T> = {
    /** `true` if this account's data contains a loaded program */
    executable: boolean;
    /** Identifier of the program that owns the account */
    owner: NearPublicKey;
    /** Number of lamports assigned to the account */
    lamports: number;
    /** Optional data assigned to the account */
    data: T;
    /** Optional rent epoch info for account */
    rentEpoch?: number;
};

export type Context = {
    slot: number;
};

export type AccountChangeCallback = (accountInfo: AccountInfo<Buffer>, context: Context) => void;

export type Commitment =
    | 'processed'
    | 'confirmed'
    | 'finalized'
    | 'recent' // Deprecated as of v1.5.5
    | 'single' // Deprecated as of v1.5.5
    | 'singleGossip' // Deprecated as of v1.5.5
    | 'root' // Deprecated as of v1.5.5
    | 'max'; // Deprecated as of v1.5.5

type ClientSubscriptionId = number;

export type SlotInfo = {
    /** Currently processing slot */
    slot: number;
    /** Parent of the current slot */
    parent: number;
    /** The root block of the current slot's fork */
    root: number;
};

export type SlotChangeCallback = (slotInfo: SlotInfo) => void;

export type GetTokenAccountsByOwnerConfig = {
    /** Optional commitment level */
    commitment?: Commitment;
    /** The minimum slot that the request can be evaluated at */
    minContextSlot?: number;
};

export interface NearConnectionConfig {
    nodeUrl: string;
    networkId: string;
    jsvmAccountId: string;
}

export class NearConnection extends Connection {
    private config: NearConnectionConfig;
    private _provider: JsonRpcProvider | null = null;
    private _solanaConnection: SolanaConnection = new SolanaConnection('devnet');
    constructor(config: NearConnectionConfig) {
        const signer = new InMemorySigner(new keyStores.InMemoryKeyStore());
        const provider = new JsonRpcProvider({ url: config.nodeUrl });

        super(config.networkId, provider, signer, config.jsvmAccountId);
        this.config = config;

        this._provider = new JsonRpcProvider({
            url: config.nodeUrl,
            // user: 'testnet',
            // password: '',
            // allowInsecure: false,
            // timeout: 15000,
            // headers: {
            //     'Content-Type': 'application/json',
            // },
        });
    }

    public chain: Chain = ChainNetworks.NEAR;

    getLatestBlockhash = async (): Promise<{
        blockhash: string;
        lastValidBlockHeight: number;
    } | null> => {
        // const accessKey = await this.provider.query(
        //     `access_key/${this.config.c}/${this.nearPublicKey.toString()}`,
        //     ''
        // );
        const accessKey: QueryResponseKind | null = null;
        if (!accessKey) return null;

        console.info('_createTransaction: accessKey');
        console.dir(accessKey);
        //@ts-ignore
        const nonce = accessKey.nonce + 1;
        console.info('_createTransaction: nonce');
        console.dir(nonce);
        const recentBlockHash = accessKey ? base_decode(accessKey) : 0;
        return {
            blockhash: recentBlockHash.toString(),
            lastValidBlockHeight: 0,
        };
    };
    sendRawTransaction = async <TxSig extends NearTransactionSignature>(
        rawTransaction: Buffer | number[] | Uint8Array,
        options?: NearSendOptions | undefined
    ): Promise<TxSig> => {
        // return await super.sendRawTransaction(rawTransaction, options) as TxSig;
        return '' as TxSig;
    };

    getAccountInfo = async (publicKey: NearPublicKey) => {
        throw new Error('Get account info not yet implimented on Near connections');
    };

    onAccountChange(
        publicKey: NearPublicKey,
        callback: AccountChangeCallback,
        commitment?: Commitment
    ): ClientSubscriptionId {
        throw new Error('On account Change info not yet implimented on Near connections');
    }

    removeAccountChangeListener = (clientSubscriptionId: ClientSubscriptionId) => {
        throw new Error('Remove account change listener not yet implimented on Near connections');
    };

    onSlotChange(callback: SlotChangeCallback): ClientSubscriptionId {
        throw new Error('On slot change not yet implimented on Near connections');
    }

    removeSlotChangeListener = (clientSubscriptionId: ClientSubscriptionId) => {
        throw new Error('Remove slot change not yet implimented on Near connections');
    };

    getTokenAccountsByOwner = async (
        ownerAddress: NearPublicKey,
        filter: TokenAccountsFilter,
        commitmentOrConfig?: Commitment | GetTokenAccountsByOwnerConfig
    ) => {
        return this._solanaConnection.getTokenAccountsByOwner(ownerAddress, filter, commitmentOrConfig);
    };
}

// export interface NearConnection extends SolanaConnection {}
// applyMixins(NearConnection, [SolanaConnection]);

// export class NearPublicKey extends PublicKey {
export class NearPublicKey extends NativeSolanaPublicKey {
    constructor(publicKey: string) {
        super(publicKey);
    }

    public toBase58 = () => this._toSolanaPublicKey();

    private _toSolanaPublicKey = (): string => {
        const key = super.toString();
        console.info(`setting public key: ${key}`);
        const _nearPublicKey = PublicKey.fromString(key);
        console.info('Near Public Key ', _nearPublicKey);
        // const pubKeyBase58 = pubKey.toString().substring(8, pubKey.toString().length);
        // console.debug(`Near: pubKeyBase58: ${pubKeyBase58}`);
        const solPubkey = this._getPublicKey(removeEd25519(key));
        console.info('Solana Public Key ', solPubkey.toBase58());
        new SolanaPublicKey(solPubkey.toString());
        return solPubkey.toBase58();
    };

    private _getPublicKey = (key: string) => {
        const solPubkey = new SolanaPublicKey(key);
        // this.emitter.emit('connect', solPubkey);
        // this.emitter.emit('publicKey', solPubkey);
        return solPubkey;
    };
}

export class NearKeypair implements IKeypair {
    readonly publicKey: NearPublicKey;
    readonly secretKey: Uint8Array;

    constructor(secretKey?: Uint8Array) {
        const generatedKey = this.generate().secretKey;
        const decodedKey = decodeBase58(generatedKey);
        this.secretKey = secretKey ?? decodedKey;
        this.publicKey = new NearPublicKey(KeyPair.fromString(generatedKey).getPublicKey().toString());
    }
    sign = (message: Uint8Array): Signature => {
        const signature = nacl.sign.detached(message, baseDecode(encodeBase58(this.secretKey)));
        return { signature, publicKey: new PublicKey(this.publicKey) };
    };

    verify = (message: Uint8Array, signature: Uint8Array): boolean =>
        new PublicKey(this.publicKey)?.verify(message, signature);

    toString = (): string => `ed25519:${encodeBase58(this.secretKey)}`;

    getPublicKey = (): NearPublicKey => this.publicKey;

    generate = (): KeyPairEd25519 => KeyPairEd25519.fromRandom();
}

export interface NearSendOptions {
    preflightCommitment?: SolanaCommitment;
}

export abstract class NearSigner extends Signer {
    public publicKey: SolanaPublicKey;
    public secretKey: Uint8Array;
    constructor(publicKey: SolanaPublicKey, secretKey: Uint8Array) {
        super();
        this.publicKey = publicKey;
        this.secretKey = secretKey;
    }
}

export class NearTransaction extends Transaction {
    public feePayer?: SolanaPublicKey;
    recentBlockhash?: string;

    private _near: Near | null = null;
    public keyType: KeyType;
    private _keypair: KeyPair | undefined;
    public accountId = super.receiverId;
    private _connection?: NearConnection;
    private solanaTransaction: SolanaTransaction;
    private config?: NearConnectionConfig;

    constructor(connection?: NearConnection) {
        super(connection);
        this.solanaTransaction = new SolanaTransaction();
        this.keyType = this._getKeyType();
        this._connection = connection;
    }

    public partialSign = (...signers: Array<NearSigner>) => {
        return this.solanaTransaction.partialSign(...signers);
    };

    public serialize = (config?: SerializeConfig) => {
        return this.solanaTransaction.serialize(config);
    };

    private _getKeyType = () => super.publicKey.keyType;

    // _getAccount = () => {
    //     if (!this._connection) return;
    //     console.debug('_getAccountId');
    //     const account = this._connection.account();
    //     console.debug('account');
    //     console.dir(account);
    //     return account;
    // };

    // populate

    _getAccountId = () => {
        if (!this._connection) return;
        console.debug('_getAccountId');
        const accountId: string = this._connection.networkId;
        console.debug('accountId');
        console.dir(accountId);
        return accountId;
    };

    _createTransaction = async (): Promise<Transaction> => {
        // if (!this._privateKey) {
        //   throw new WalletError('Private keys not found!');
        // }

        if (!this.accountId) {
            throw new WalletError('Account Id not found!');
        }

        if (!this.publicKey) {
            throw new WalletError('Public Key not found!');
        }

        // const keyPair = KeyPairEd25519.fromString(this._privateKey);
        // const publicKey = keyPair.getPublicKey()
        // const publicKey = new NearPublicKey(removeEd25519(this.publicKey.toBase58()));

        const accessKeyTest = await this.getAccessKey();
        console.info('_createTransaction: accessKeyTest');
        console.dir(accessKeyTest);

        const accessKey = await this._connection?.provider.query(
            `access_key/${this._connection?.networkId}/${this.publicKey.toString()}`,
            ''
        );
        if (!accessKey) {
            throw new Error('Unable to create Near transaction: Unable to fetch accessKey');
        }
        console.info('_createTransaction: accessKey');
        console.dir(accessKey);
        //@ts-ignore
        const nonce = accessKey.nonce + 1;
        console.info('_createTransaction: nonce');
        console.dir(nonce);
        const recentBlockHash = base_decode(accessKey.block_hash);
        console.info('_createTransaction: recentBlockHash');
        console.dir(recentBlockHash);
        const actions = [transfer(new BN(1))];

        const transaction = createNearTransaction(
            this.accountId,
            this.publicKey,
            this.accountId,
            nonce,
            actions,
            recentBlockHash
        );
        console.info('_createTransaction: transaction');
        console.dir(transaction);
        return transaction;
    };

    _signTransaction = async (transaction: NearTransaction): Promise<string | undefined> => {
        console.warn('func: _signTransaction');

        if (!this._keypair) {
            throw new WalletError('No keypairs found!');
        }

        console.debug('_signTransaction: transaction');
        console.dir(transaction);
        console.debug('_signTransaction: SCHEMA');
        console.dir(SCHEMA);

        const nearTx = await this._createTransaction();
        console.debug('_signTransaction: nearTx');
        console.dir(nearTx);
        console.dir(transaction);

        // const serializedTx = serialize(SCHEMA, transaction.data);
        const serializedTx = serialize(transactions.SCHEMA, nearTx);
        console.debug('_signTransaction: serializedTx', serializedTx);
        const encodedSerializedTx = encodeBase58(serializedTx);
        console.debug('_signTransaction: encodedSerializedTx', encodedSerializedTx);

        const serializedTxHash = CryptoJS.SHA256(encodedSerializedTx).toString();
        console.debug('_signTransaction: serializedTxHash', serializedTxHash);
        const serializedTxHashBuf = Buffer.from(serializedTxHash);
        console.debug('_signTransaction: serializedTxHashBuf', serializedTxHashBuf);

        const signature = this._keypair.sign(serializedTxHashBuf);
        console.debug('signature', signature);
        if (!signature || !signature.signature) {
            console.warn('_signTransaction: signature empty!');
            return;
        }

        const signedTransaction = new SignedTransaction({
            transaction,
            // nearTx,
            signature: new NearSignature({
                keyType: transaction.publicKey.keyType,
                // keyType: KeyType,
                data: signature.signature,
            }),
        });
        console.info('_signTransaction: signedTransaction');
        console.dir(signedTransaction);
        if (!signedTransaction) {
            console.warn('_signTransaction: signedTransaction empty!');
            return;
        }

        // encodes transaction to serialized Borsh (required for all transactions)

        try {
            const signedSerializedTx = signedTransaction.encode();
            // const provider = new JsonRpcProvider(this._config.nodeUrl);
            const result = await this._connection?.provider.query(
                'broadcast_tx_commit',
                // const result = await sendJsonRpc("broadcast_tx_commit", [
                Buffer.from(signedSerializedTx).toString('base64')
            );
            console.info('_signTransaction: result');
            console.dir(result);
            const sig = encodeBase58(signedTransaction.encode());
            console.info(`Near tx sig 1: ${sig}`);
            return sig;
        } catch (e) {
            console.error(e);
            const sig = encodeBase58(signature.signature);
            console.info(`Near tx sig 2: ${sig}`);
            return sig;
        }
    };

    _verifySignature = (data: Uint8Array, signature: Uint8Array) => {
        if (!this._keypair) {
            throw new WalletError('No keypairs found!');
        }
        if (!this.accountId) {
            throw new WalletError('Account Id not found!');
        }
        const isValid = this._keypair.verify(data, signature);
        console.info('_verifySignature: Signature Valid?:', isValid);
        return isValid;
    };

    verifySignature = (msg: string, signature: Uint8Array) => {
        const msgBuf = Buffer.from(msg);
        const isValid = this._verifySignature(msgBuf, signature);
        console.info('verifySignature: Signature Valid?:', isValid);
        return isValid;
    };

    async signTransaction(transaction: NearTransaction): Promise<NearTransaction> {
        console.warn('func: signTransaction');

        if (!this.publicKey) {
            throw new WalletError('Public key not set!');
        }

        if (!this._keypair) {
            throw new WalletError('No keypairs found!');
        }

        // const { keypair } = getNativeKeyPairFromPrivateKey(
        //   ChainNetworks.SOL,
        //   this._keypair?.privateKey ?? '',
        // ) as SolanaKeys;

        // console.debug('transaction', transaction);
        // const newTx = new SolanaTransaction();
        // console.info('signTransaction: newTx empty!')
        // console.dir(newTx)
        // newTx.recentBlockhash = transaction.recentBlockhash;
        // newTx.feePayer = transaction.feePayer;
        // newTx.instructions = transaction.instructions;

        // console.info('signTransaction: newTx pre sigs!')
        // console.dir(newTx)

        // const transactions = [transaction];

        // this._keypair.sign(transaction)
        // transaction.sign(transaction)

        return transaction;

        // const signaturePromises = transactions.map((instruction) => {
        //     // const keys = instruction.keys.map((k) => k.pubkey.toBase58());
        //     console.info(`signing for:`);
        //     console.table(instruction);
        //     return this._sign(
        // });

        // const instructionSignatures = await Promise.all(signaturePromises);

        // return new Promise<NearTransaction>((resolve, reject) => {
        //     console.info('signing keys for ', transaction.feePayer?.toBase58());
        //     // const transactionBuffer = transaction.serializeMessage();
        //     const signatures = instructionSignatures.map((sigs: NearTransactionSignature) => {
        //         // const nearTx = new Transaction(instruction);
        //         // const sig = this._signTransaction(instruction);
        //         // const sigBuf = await this.sign(instruction.data);
        //         // const keys = instruction.keys.map(k => k.pubkey.toBase58());
        //         // console.info(`signing for:`)
        //         // console.table(keys)
        //         const { signature, publicKey } = sigs;
        //         const encodedSig = encodeBase58(Buffer.from(signature));
        //         const pubKeyStr = removeEd25519(publicKey.toString());
        //         // const sig = encodeBase58(sigBuf);
        //         // return sigBuf
        //         return { encodedSig, pubKeyStr };
        //         // return sig
        //     });

        //     // const signatures = await Promise.all(signaturePromises)
        //     console.info(signatures);
        //     console.table(signatures);

        //     // const signature = signatures[0];
        //     // console.debug('transactionBuffer', transactionBuffer);
        //     // console.debug('signTransaction: signature', signature);
        //     if (!signatures || signatures.length < 1) {
        //         console.warn('signTransaction: empty signature!');
        //         reject(transaction);
        //         return;
        //     }

        //     console.debug('transaction', transaction);
        //     // const newTx = new SolanaTransaction();
        //     // console.info('signTransaction: newTx empty!');
        //     // console.dir(newTx);
        //     // newTx.recentBlockhash = transaction.recentBlockhash;
        //     // newTx.feePayer = transaction.feePayer;
        //     // newTx.instructions = transaction.instructions;

        //     // console.info('signTransaction: newTx pre sigs!');
        //     // console.dir(newTx);

        //     // if (!this.publicKey) {
        //     //     console.warn('signTransaction: empty public Key!');
        //     //     reject(transaction);
        //     //     return;
        //     // }
        //     // const pubKey = this.publicKey;
        //     // // signatures.forEach(sig => newTx.addSignature(pubKey, decodeBase58(sig)))
        //     // // signatures.forEach(sig => newTx.addSignature(pubKey, Buffer.from(sig.encodedSig)))
        //     // signatures.forEach((sig) => newTx.addSignature(pubKey, Buffer.from(decodeBase58(sig.encodedSig))));

        //     // console.info('signTransaction: added sigs!');
        //     // console.dir(newTx);
        //     console.dir(transaction);

        //     // transaction.addSignature(this.publicKey, decodeBase58(signature));
        //     // console.info('signTransaction: added sigs! 2')
        //     // console.dir(newTx)

        //     resolve(transaction);
        // });
    }

    requestSignTransaction = async (transaction: Transaction): Promise<Transaction> => {
        if (!this._connection) {
            throw new WalletError('Wallet not connected');
        }

        if (!transaction) {
            throw new WalletError('No transaction received!');
        }

        // await this._connection.requestSignTransactions({
        //     transactions: [transaction],
        // });
        return transaction;
    };

    async signAllTransactions(transactions: NearTransaction[]): Promise<NearTransaction[]> {
        // ): Promise<void> {

        if (!this._connection) {
            throw new WalletError('Wallet not connected');
        }

        if (!transactions || transactions.length < 1) {
            throw new WalletError('No transactions received!');
        }

        console.warn('this._connection');
        console.dir(this._connection);
        console.dir(transactions);

        // this._connection.requestSignTransactions(transactions)

        const _txs = transactions.map((transaction) => {
            return this.signTransaction(transaction);
        });
        return await Promise.all(_txs);
    }

    _signWithKey = async (pubKey: SolanaPublicKey, data: Uint8Array): Promise<Signature> => {
        if (!this._keypair) {
            throw new WalletError('No keypairs found!');
        }
        return this._keypair.sign(data);
    };

    _sign = async (data: Uint8Array): Promise<Signature> => {
        if (!this._keypair) {
            throw new WalletError('No keypairs found!');
        }
        // console.warn('func: _sign');
        // console.info('this._keypair pubKey', this._keypair.getPublicKey().toString());
        // console.info('this._keypair keytype', this._keypair.getPublicKey().keyType);
        // console.info('near pubKey', this._nearPublicKey?.toString());
        // console.info('near pubKey keytype', this._nearPublicKey?.keyType);
        // console.info('solana pubKey', this._solanaPublicKey?.toBase58());
        // console.info('pubKey', this.publicKey?.toBase58());
        // console.info('connected account', this._connection?._connectedAccount);
        // console.info('account', this._connection?.account.toString());
        // console.info('connected Account', this._connection?._connectedAccount);
        // console.dir('_authDataKey');
        // console.dir(this._connection?._authDataKey);
        // // this._connection?._completeSignInWithAccessKey()
        // console.info('accountId', this._connection?.getAccountId());
        // console.info('is signedin', this._connection?.isSignedIn);
        // console.dir(this._connection);
        return this._keypair.sign(data);
    };

    async signMessage(msg: string): Promise<string> {
        console.info('signMessage: msg', msg);
        const msgBuf = Buffer.from(msg);
        console.dir(msgBuf);

        const signature = await this._sign(msgBuf);
        console.info('signMessage: signature');
        console.dir(signature);
        const isValid = this._verifySignature(msgBuf, signature.signature);
        console.info('signedMessage valid?', isValid);

        return encodeBase58(signature.signature);
    }

    sign = async (data: Uint8Array): Promise<Uint8Array> => {
        if (!this._keypair) {
            throw new WalletError('No keypairs found!');
        }

        const signature = await this._sign(data);
        console.info('signMessage: signature', signature.publicKey.toString());
        console.dir(signature);
        const isValid = this._verifySignature(data, signature.signature);
        console.info('sign valid?', isValid);
        return signature.signature;
    };

    getAccessKey = async () => {
        console.warn('func: getAccessKeys');
        if (!this._connection) {
            throw new WalletError('Wallet not connected');
        }

        if (!this.accountId) {
            throw new WalletError('Account Id not found!');
        }

        const response = await this._connection?.provider.query({
            request_type: 'view_access_key',
            finality: 'final',
            account_id: this.accountId,
            public_key: this.publicKey.toString(),
        });
        console.info('getAccessKeys: response');
        console.dir(response);
        return response;
    };

    calculateGas = async (
        contractId: string,
        methodName: string,
        args: Uint8Array,
        depositAmount?: string
    ): Promise<Gas> => {
        console.info('Calculating gas ...');
        // const near = await connect(config);
        // const account = await near.account(ACCOUNT_ID);

        const accountId = this._getAccountId();
        if (!accountId) {
            throw new WalletError('Failed to get Account id!');
        }

        const parseDepositCheck = utils.format.parseNearAmount(depositAmount ?? '0');
        if (!parseDepositCheck) {
            throw new WalletError(`Failed to parse deposit check of '${depositAmount}'`);
        }

        const account = await this._near?.account(accountId);
        console.info('Pushing calc ...');
        const result = await account?.functionCall({
            contractId,
            methodName,
            args,
            gas: new BN(MAX_GAS),
            // attachedDeposit: utils.format.parseNearAmount(depositAmount),
            attachedDeposit: new BN(parseDepositCheck),
        });

        const gasResult = result?.receipts_outcome.reduce<Gas>(
            (acc, receipt) => {
                acc.totalGasBurned += receipt.outcome.gas_burnt;
                acc.totalTokensBurned += utils.format.formatNearAmount(receipt.outcome.tokens_burnt);
                return acc;
            },
            {
                totalGasBurned: result.transaction_outcome.outcome.gas_burnt,
                totalTokensBurned: utils.format.formatNearAmount(result.transaction_outcome.outcome.tokens_burnt),
            }
        );
        if (!gasResult) {
            throw new WalletError('Failed to pull gas cost from chain!');
        }

        const { totalGasBurned, totalTokensBurned } = gasResult;

        const gas = {
            totalTokensBurned,
            totalGasBurned,
        };
        console.debug('Gas fees');
        console.dir(gas);
        return gas;
    };

    serializeMessage(): Buffer {
        const emptyMessage = baseDecode('');
        return emptyMessage;
    }

    addSignature = (publicKey: ChainPublicKey, signature: Uint8Array) => {
        console.debug('addSignature method not yet implimented on Near');
    };
}

export type NearTransactionSignature = string;

export type NearTransactionSignatureData = SignedTransaction['signature']['data'];
