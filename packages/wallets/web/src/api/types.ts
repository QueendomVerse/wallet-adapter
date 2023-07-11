import type { LocalItemStore, LocalProfileStore, LocalUserStore, LocalWalletStore } from '../store';

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

interface LocalUserStore2 {
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
