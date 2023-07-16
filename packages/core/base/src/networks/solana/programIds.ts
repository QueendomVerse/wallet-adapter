import {
    METADATA_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    METAPLEX_ID,
    BPF_UPGRADE_LOADER_ID,
    SYSTEM,
    MEMO_ID,
    VAULT_ID,
    AUCTION_ID,
    PACK_CREATE_ID,
    ORACLE_ID,
} from './ids';

export const programIds = () => ({
    token: TOKEN_PROGRAM_ID,
    associatedToken: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    bpf_upgrade_loader: BPF_UPGRADE_LOADER_ID,
    system: SYSTEM,
    metadata: METADATA_PROGRAM_ID,
    memo: MEMO_ID,
    vault: VAULT_ID,
    auction: AUCTION_ID,
    metaplex: METAPLEX_ID,
    pack_create: PACK_CREATE_ID,
    oracle: ORACLE_ID,
    store: undefined,
});
