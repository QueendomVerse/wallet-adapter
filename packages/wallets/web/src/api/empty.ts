import { MetadataCategory } from '@/networks/solana';
import type { Item, Items, Profile, Profiles, User, Users, Wallet, Wallets } from './types';
import { ArtType } from './types';

export const emptyItem: Item = {
    id: '',
    identifier: '',
    uri: '',
    image: '',
    artists: [],
    mint: '',
    link: '',
    external_url: '',
    title: '',
    seller_fee_basis_points: 0,
    creators: [],
    type: ArtType.NFT,
    category: MetadataCategory.Image,
    edition: 0,
    supply: 0,
    maxSupply: 0,
    solPrice: 0,
    description: '',
    story: '',
    attributes: [
        {
            trait_type: '',
            display_type: '',
            value: '', // or 0
        },
    ],
    files: [
        {
            uri: '',
            type: '',
        },
    ],
    chain: '',
    tokenMint: '',
    publicKey: '',
    createdAt: '',
    updatedAt: '',
};

export const emptyItems: Items = {
    data: [emptyItem],
};

export const emptyProfile: Profile = {
    id: '',
    name: '',
    url: '',
    bio: '',
    twitter: '',
    site: '',
    email: '',
    avatarUrl: '',
    walletAddress: '',
    createdAt: '',
    updatedAt: '',
};

export const emptyProfiles: Profiles = {
    data: [emptyProfile],
};

export const emptyUser: User = {
    id: '',
    name: '',
    email: '',
    role: '',
    walletAddress: '',
    image: '',
    avatar: '',
    banner: '',
    roles: [],
    settings: ['setting'],
    wallets: [],
    isSelected: false,
    createdAt: '',
    updatedAt: '',
};

export const emptyUsers: Users = {
    data: [emptyUser],
};

export const emptyWallet: Wallet = {
    userId: '',
    chain: '',
    label: '',
    pubKey: '',
    encryptedSeedPhrase: '',
    encryptedPrivKey: '',
    balance: 0,
    createdAt: '',
    updatedAt: '',
};

export const emptyWallets: Wallets = {
    data: [emptyWallet],
};
