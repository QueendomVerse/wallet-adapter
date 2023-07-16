import type {
    ApiItem,
    ApiItems,
    ApiProfile,
    ApiProfiles,
    ApiUser,
    ApiUsers,
    ApiWallet,
    ApiWallets,
} from '@mindblox-wallet-adapter/base';
import { ArtType } from '@mindblox-wallet-adapter/base';
import { MetadataCategory } from '@mindblox-wallet-adapter/solana';

import { DEFAULT_CHAIN } from '../constants';

export const emptyItem: ApiItem = {
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
    chain: DEFAULT_CHAIN,
    tokenMint: '',
    publicKey: '',
    createdAt: '',
    updatedAt: '',
};

export const emptyItems: ApiItems = {
    data: [emptyItem],
};

export const emptyProfile: ApiProfile = {
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

export const emptyProfiles: ApiProfiles = {
    data: [emptyProfile],
};

export const emptyUser: ApiUser = {
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

export const emptyUsers: ApiUsers = {
    data: [emptyUser],
};

export const emptyWallet: ApiWallet = {
    userId: '',
    chain: DEFAULT_CHAIN,
    label: '',
    pubKey: '',
    encryptedSeedPhrase: '',
    encryptedPrivKey: '',
    balance: 0,
    createdAt: '',
    updatedAt: '',
};

export const emptyWallets: ApiWallets = {
    data: [emptyWallet],
};
