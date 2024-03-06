export interface NftMetaData {
    title?: string; // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
    description?: string; // free-form description
    media?: string; // URL to associated media, preferably to decentralized, content-addressed storage
    mediaHash?: string; // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
    copies?: number; // number of copies of this set of metadata in existence when token was minted.
    issuedAt?: number; // When token was issued or minted, Unix epoch in milliseconds
    expiresAt?: number; // When token expires, Unix epoch in milliseconds
    startsAt?: number; // When token starts being valid, Unix epoch in milliseconds
    updatedAt?: number; // When token was last updated, Unix epoch in milliseconds
    extra?: string | undefined; // anything extra the NFT wants to store on-chain. Can be stringified JSON.
    reference?: string | undefined; // URL to an off-chain JSON file with more info.
    referenceHash?: string | undefined; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
}