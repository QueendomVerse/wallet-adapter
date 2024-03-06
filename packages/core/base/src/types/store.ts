// @TODO: make url, bio, twitter, site, avatarUrl, and walletAddress optional => ?

import type { Chain } from '../chains';
import type { Creator, MetadataCategory, Attribute, FileOrString } from '../networks/solana/metadata';
import type { ChainKeypair } from './chains';

export enum ArtType {
    Master,
    Print,
    NFT,
}

export interface Artist {
    address?: string;
    name: string;
    link: string;
    image: string;
    itemsAvailable?: number;
    itemsSold?: number;
    about?: string;
    verified?: boolean;
    background?: string;
    share?: number;
}

// @NOTES ensure corresponding changes are propagated to local and backend User schema
export interface LocalUserStore {
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
    wallets?: LocalWalletStore[];
}

export interface LocalUsers {
    data: LocalUserStore[];
}

export interface LocalWalletStore {
    gid?: string;
    chain: Chain;
    label: string;
    pubKey: string;
    encryptedSeedPhrase: string;
    encryptedPrivKey: string;
    balance: number;
    isSelected?: boolean;
    privKey?: Uint8Array;
    seed?: Uint8Array;
    seedPhrase?: string;
    transactions?: LocalTransactionStore[];
}

export interface LocalWallets {
    data: LocalWalletStore[];
}

export interface LocalProfileStore {
    id: string;
    name: string;
    url?: string;
    bio?: string;
    twitter?: string;
    site?: string;
    email: string;
    avatarUrl?: string;
    walletAddress: string;
}

export interface LocalKeypairStore {
    chain: Chain;
    publicKey: string;
    privateKey?: string;
    keypair?: ChainKeypair;
    implicitId?: string;
}

export interface LocalMintStore {
    walletId: string;
    mint: string;
    owner: string;
    address: string;
}

export interface LocalItemStore {
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
    chain: Chain;
    tokenMint?: string;
    publicKey?: string;
}

export interface LocalTransactionStore {
    blockTime: number | null | undefined;
    slot: number;
    amount: number;
    fee: number;
    isToken: boolean;
}
