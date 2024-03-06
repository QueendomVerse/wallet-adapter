import type {
    GetProgramAccountsResponse,
    GetTokenAccountsByOwnerConfig,
    RpcResponseAndContext,
    TokenAccountsFilter,
} from '@solana/web3.js';
import { Connection } from '@solana/web3.js';

import type { Chain } from '../../chains';
import { ChainNetworks } from '../../chains';

import type { SolanaPublicKey } from './publicKey';
import type { SolanaCommitment, SolanaSendOptions, SolanaTransactionSignature } from './types';

export class SolanaConnection extends Connection {
    public chain: Chain = ChainNetworks.SOL;
    public async sendRawTransaction<TxSig extends SolanaTransactionSignature>(
        rawTransaction: Buffer | number[] | Uint8Array,
        options?: SolanaSendOptions | undefined
    ): Promise<TxSig> {
        return (await super.sendRawTransaction(rawTransaction, options)) as TxSig;
    }

    public async getTokenAccountsByOwner(
        ownerAddress: SolanaPublicKey,
        filter: TokenAccountsFilter,
        commitmentOrConfig?: SolanaCommitment | GetTokenAccountsByOwnerConfig
    ): Promise<RpcResponseAndContext<GetProgramAccountsResponse>> {
        return await super.getTokenAccountsByOwner(ownerAddress, filter, commitmentOrConfig);
    }
}