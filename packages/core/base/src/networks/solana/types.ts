import type {
    Commitment,
    GetProgramAccountsResponse,
    GetTokenAccountsByOwnerConfig,
    RpcResponseAndContext,
    SendOptions,
    Signer,
    TokenAccountsFilter,
    TransactionSignature,
    ConnectionConfig,
} from '@solana/web3.js';
import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';

import type { Chain } from '../../chains';
import { ChainNetworks } from '../../chains';
import type { IKeypair } from '../../types';
import type { Creator, Attribute, FileOrString } from './metadata';
import { MetadataCategory } from './metadata';

export class SolanaConnection extends Connection {
    public chain: Chain = ChainNetworks.SOL;
    public sendRawTransaction = async <TxSig extends SolanaTransactionSignature>(
        rawTransaction: Buffer | number[] | Uint8Array,
        options?: SolanaSendOptions | undefined
    ): Promise<TxSig> => {
        return (await super.sendRawTransaction(rawTransaction, options)) as TxSig;
    };
    public getTokenAccountsByOwner = async (
        ownerAddress: PublicKey,
        filter: TokenAccountsFilter,
        commitmentOrConfig?: SolanaCommitment | GetTokenAccountsByOwnerConfig
    ): Promise<RpcResponseAndContext<GetProgramAccountsResponse>> =>
        await super.getTokenAccountsByOwner(ownerAddress, filter, commitmentOrConfig);
}

export type SolanaCommitment = Commitment;

export class SolanaPublicKey extends PublicKey {}

// export class SolanaPublicKey implements IPublicKey {
//     private publicKey: PublicKey;

//     constructor(publicKey: string) {
//         this.publicKey = new PublicKey(publicKey)
//     }

//     toBase58 = () => this.publicKey.toBase58()
// }

export class SolanaKeypair implements IKeypair {
    private keypair: Keypair;

    constructor(secretKey?: Uint8Array) {
        if (secretKey) {
            this.keypair = Keypair.fromSecretKey(secretKey);
        } else {
            this.keypair = Keypair.generate();
        }
    }

    get publicKey(): SolanaPublicKey {
        return new SolanaPublicKey(this.keypair.publicKey.toBase58());
    }

    get secretKey(): Uint8Array {
        return this.keypair.secretKey;
    }

    static fromSecretKey(secretKey: Uint8Array): SolanaKeypair {
        return new SolanaKeypair(secretKey);
    }
    static fromSeed(seed: Uint8Array): SolanaKeypair {
        const keypair = Keypair.fromSeed(seed);
        return new SolanaKeypair(keypair.secretKey);
    }
}

export interface SolanaSendOptions extends SendOptions {
    preflightCommitment?: SolanaCommitment;
}

export interface SolanaSigner extends Signer {}

export class SolanaTransaction extends Transaction {
    public feePayer?: PublicKey | undefined = super.feePayer;
    public partialSign = (...signers: Array<SolanaSigner>): void => {
        super.partialSign(...signers);
        super.serialize();
    };
}

export type SolanaTransactionSignature = TransactionSignature;

export interface SolanaCreator extends Creator {}
export { MetadataCategory as SolanaMetadataCategory };
export interface SolanaAttribute extends Attribute {}
export type SolanaFileOrString = FileOrString;

export interface SolanaConnectionConfig extends ConnectionConfig {}
