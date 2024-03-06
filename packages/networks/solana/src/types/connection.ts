import {
    Chain, ChainNetworks, SolanaTransactionSignature, SolanaSendOptions, SolanaPublicKey, SolanaCommitment
} from '@mindblox-wallet-adapter/base';
import type {
    GetProgramAccountsResponse,
    GetTokenAccountsByOwnerConfig,
    RpcResponseAndContext,
    TokenAccountsFilter,
} from '@solana/web3.js';
import { Connection } from '@solana/web3.js';



export class SolanaConnection extends Connection {
    public chain: Chain = ChainNetworks.SOL;
    public sendRawTransaction = async <TxSig extends SolanaTransactionSignature>(
        rawTransaction: Buffer | number[] | Uint8Array,
        options?: SolanaSendOptions | undefined
    ): Promise<TxSig> => {
        return (await super.sendRawTransaction(rawTransaction, options)) as TxSig;
    };
    public getTokenAccountsByOwner = async (
        ownerAddress: SolanaPublicKey,
        filter: TokenAccountsFilter,
        commitmentOrConfig?: SolanaCommitment | GetTokenAccountsByOwnerConfig
    ): Promise<RpcResponseAndContext<GetProgramAccountsResponse>> =>
        await super.getTokenAccountsByOwner(ownerAddress, filter, commitmentOrConfig);
}
