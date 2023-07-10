import type { ArtType, Artist } from '@web/api';
import type { Attribute, Creator, FileOrString, MetadataCategory } from '@web/networks/solana';

// @TODO: make url, bio, twitter, site, avatarUrl, and walletAddress optional => ?
// @NOTES ensure corresponding changes are propagated to local and backend User schema
export interface User {
    gid?: string;
    id: string;
    name: string;
    email: string;
    role: string;
    walletAddress: string;
    image: string;
    avatar: string;
    banner: string;
    roles: string[]; //@TODO enum instead? role type?
    settings: string[];
    isSelected?: boolean;
    password?: string; //@TODO change name to (encoded/encrypted)Password?
    hashedPassword?: string;
    wallets?: Wallet[];
}

export interface Profile {
    id: string;
    name: string;
    url: string;
    bio: string;
    twitter: string;
    site: string;
    email: string;
    avatarUrl: string;
    walletAddress: string;
}

export interface KeyPair {
    chain: string;
    publicKey: string;
    privateKey?: string;
    implicitId?: string;
}

// @TODO reorder logically; label, chain, pubKey ....=
export interface Wallet {
    gid?: string;
    chain: string;
    label: string;
    pubKey: string;
    encryptedSeedPhrase: string;
    encryptedPrivKey: string;
    balance: number;
    isSelected?: boolean;
    privKey?: Uint8Array;
    seed?: Uint8Array;
    seedPhrase?: string;
    transactions?: Transaction[];
}

export interface Mint {
    walletId: string;
    mint: string;
    owner: string;
    address: string;
}

export interface Item {
    gid?: string;
    id: string;
    identifier: string;
    uri?: string;
    image: string;
    artists?: Artist[] | [];
    mint?: string;
    link?: string;
    external_url?: string;
    title: string;
    seller_fee_basis_points?: number;
    creators?: Creator[] | [];
    type?: ArtType;
    category: MetadataCategory;
    edition?: number;
    supply?: number;
    maxSupply?: number;
    solPrice: number;
    description?: string;
    story?: string;
    attributes?: Attribute[];
    files?: FileOrString[];
    chain: string;
    tokenMint?: string;
    publicKey?: string;
}

export interface Transaction {
    blockTime: number | null | undefined;
    slot: number;
    amount: number;
    fee: number;
    isToken: boolean;
}