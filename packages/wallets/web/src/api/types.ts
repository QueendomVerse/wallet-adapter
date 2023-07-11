import type { LocalItemStore, LocalProfileStore, LocalUserStore, LocalWalletStore } from '@/store';

export interface Item extends LocalItemStore {
    createdAt: string;
    updatedAt: string;
}

export interface Items {
    data: Item[];
}

export interface Profile extends LocalProfileStore {
    createdAt: string;
    updatedAt: string;
}

export interface Profiles {
    data: Profile[];
}

export interface User extends LocalUserStore {
    createdAt: string;
    updatedAt: string;
}

export interface Users {
    data: User[];
}

export interface Wallet extends LocalWalletStore {
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Wallets {
    data: Wallet[];
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
