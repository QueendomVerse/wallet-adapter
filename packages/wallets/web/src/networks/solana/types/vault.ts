import type { StringPublicKey } from '@/networks';

export enum VaultKey {
    Uninitialized = 0,
    VaultV1 = 3,
    SafetyDepositBoxV1 = 1,
    ExternalPriceAccountV1 = 2,
}

export class SafetyDepositBox {
    /// Each token type in a vault has it's own box that contains it's mint and a look-back
    key: VaultKey;
    /// VaultKey pointing to the parent vault
    vault: StringPublicKey;
    /// This particular token's mint
    tokenMint: StringPublicKey;
    /// Account that stores the tokens under management
    store: StringPublicKey;
    /// the order in the array of registries
    order: number;

    constructor(args: { vault: StringPublicKey; tokenMint: StringPublicKey; store: StringPublicKey; order: number }) {
        this.key = VaultKey.SafetyDepositBoxV1;
        this.vault = args.vault;
        this.tokenMint = args.tokenMint;
        this.store = args.store;
        this.order = args.order;
    }
}
