import type { LocalItemStore, LocalProfileStore, LocalUserStore, LocalWalletStore } from './store';

export interface ApiItem extends LocalItemStore {
    createdAt: string;
    updatedAt: string;
}

export interface ApiItems {
    data: ApiItem[];
}

export interface ApiProfile extends LocalProfileStore {
    createdAt: string;
    updatedAt: string;
}

export interface ApiProfiles {
    data: ApiProfile[];
}

export interface ApiUser extends LocalUserStore {
    createdAt: string;
    updatedAt: string;
}

export interface ApiUsers {
    data: ApiUser[];
}

export interface ApiWallet extends LocalWalletStore {
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface ApiWallets {
    data: ApiWallet[];
}

export type ApiResponse = {
    data: string;
    path: string;
};

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

export enum ArtType {
    Master,
    Print,
    NFT,
}

export interface Art {
    uri: string | undefined;
    mint: string | undefined;
    link: string;
    title: string;
    artist: string;
    seller_fee_basis_points?: number;
    creators?: Artist[];
    type: ArtType;
    edition?: number;
    supply?: number;
    maxSupply?: number;
}
