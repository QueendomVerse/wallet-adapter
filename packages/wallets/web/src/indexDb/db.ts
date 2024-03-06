import Dexie from 'dexie';
import { createId } from '@paralleldrive/cuid2';

import type {
    ApiItem,
    ApiProfile,
    ApiUser,
    Artist,
    Chain,
    LocalMintStore,
    LocalTransactionStore,
    LocalWalletStore
} from '@mindblox-wallet-adapter/base';
import {
    ArtType
} from '@mindblox-wallet-adapter/base';
import { notify } from '@mindblox-wallet-adapter/react';
import type {
    Creator,
    MetadataCategory,
    Attribute,
    FileOrString
} from '@mindblox-wallet-adapter/solana';

import { INDEXED_DB_VERSION } from './constants';

import {
    deleteDatabase,
    clearAllUserTables,
    readAllUsers,
    readUser,
    loadUsersByWalletAddress,
    loadUsersByEmail,
    loadUsersById,
    createUser,
    modifyUser,
    deleteUser,
    loadUserProfiles,
    createProfile,
    amendProfile,
    readAllWallets,
    loadWalletsByPublicKey,
    createWallet,
    modifyWallet,
    deleteWallet,
    loadWalletMints,
    createMint,
    loadUserWallets,
    readAllItems,
    createItem,
    amendItem,
    loadUserItems
} from './utils';


const hasDuplicates = <T>(arr: T[]): boolean => (arr.length > 1 ? true : false);
abstract class AbstractEntity {
    constructor(public gid?: string) {
        gid ? (this.gid = gid) : (this.gid = createId());
    }
    equals(e1: AbstractEntity, e2: AbstractEntity) {
        return e1.gid === e2.gid;
    }
}

// @NOTES ensure corresponding changes are propagated to local type and backend IndexDbUser schema
export class IndexDbUser extends AbstractEntity {
    wallets?: IndexDbWallet[];
    profiles?: IndexDbProfile[];

    constructor(
        public id: string,
        public name: string,
        public email: string,
        public role: string,
        public walletAddress: string,
        public image: string,
        public avatar: string,
        public banner: string,
        public roles: string[],
        public settings: string[],
        public isSelected: boolean,
        public createdAt: string,
        public updatedAt: string,
        public password?: string,
        public hashedPassword?: string,
        gid?: string
    ) {
        super(gid);
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.walletAddress = walletAddress;
        this.image = image;
        this.avatar = avatar;
        this.banner = banner;
        this.roles = roles;
        this.settings = settings;
        this.isSelected = isSelected;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.password = password;
        this.hashedPassword = hashedPassword;

        Object.defineProperties(this, {
            profiles: { value: [], enumerable: false, writable: true },
            wallets: { value: [], enumerable: false, writable: true },
            items: { value: [], enumerable: false, writable: true },
        });
    }
}

export class IndexDbProfile extends AbstractEntity {
    constructor(
        public id: string,
        public name: string,
        public url: string,
        public bio: string,
        public twitter: string,
        public site: string,
        public email: string,
        public avatarUrl: string,
        public walletAddress: string,
        public createdAt: string,
        public updatedAt: string,

        gid?: string
    ) {
        super(gid);
        this.id = id;
        this.name = name;
        this.url = url;
        this.bio = bio;
        this.twitter = twitter;
        this.site = site;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.walletAddress = walletAddress;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

// @TODO specify wallet chain
export class IndexDbWallet extends AbstractEntity {
    mints!: IndexDbMint[];

    constructor(
        public chain: Chain,
        public label: string,
        public pubKey: string,
        public encryptedSeedPhrase: string,
        public encryptedPrivKey: string,
        public balance: number,
        public isSelected: boolean,
        public privKey?: Uint8Array,
        public seed?: Uint8Array,
        public seedPhrase?: string,
        public transactions?: LocalTransactionStore[],
        gid?: string
    ) {
        super(gid);
        this.chain = chain;
        this.label = label;
        this.pubKey = pubKey;
        this.encryptedSeedPhrase = encryptedSeedPhrase;
        this.encryptedPrivKey = encryptedPrivKey;
        this.balance = balance;
        this.isSelected = isSelected;
        this.privKey = privKey;
        this.seed = seed;
        this.seedPhrase = seedPhrase;
        this.transactions = transactions;

        Object.defineProperties(this, {
            mints: { value: [], enumerable: false, writable: true },
        });
    }
}

export class IndexDbMint extends AbstractEntity {
    constructor(
        public walletId: string,
        public mint: string,
        public owner: string,
        public address: string,
        gid?: string
    ) {
        super(gid);
    }
}

export class IndexDbItem extends AbstractEntity {
    constructor(
        public id: string,
        public identifier: string,
        public uri: string | undefined,
        public image: string,
        public artists: Artist[] | [],
        public mint: string | undefined,
        public link: string,
        public external_url: string,
        public title: string,
        public seller_fee_basis_points: number,
        public creators: Creator[] | [],
        public type: ArtType,
        public category: MetadataCategory,
        public edition: number,
        public supply: number,
        public maxSupply: number,
        public solPrice: number,
        public description: string,
        public story: string,
        public attributes: Attribute[],
        public files: FileOrString[],
        public chain: Chain,
        public tokenMint: string,
        public publicKey: string,
        public createdAt: string,
        public updatedAt: string,

        gid?: string
    ) {
        super(gid);
        this.id = id;
        this.identifier = identifier;
        this.uri = uri;
        this.image = image;
        this.artists = artists;
        this.mint = mint;
        this.link = link;
        this.external_url = external_url;
        this.title = title;
        this.seller_fee_basis_points = seller_fee_basis_points;
        this.creators = creators;
        this.type = type;
        this.category = category;
        this.edition = edition;
        this.supply = supply;
        this.maxSupply = maxSupply;
        this.solPrice = solPrice;
        this.description = description;
        this.story = story;
        this.attributes = attributes;
        this.files = files;
        this.chain = chain;
        this.publicKey = publicKey;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

export class IndexDbAppDatabase extends Dexie {
    public users!: Dexie.Table<IndexDbUser, string>;
    public profiles!: Dexie.Table<IndexDbProfile, string>;
    public wallets!: Dexie.Table<IndexDbWallet, string>;
    public mints!: Dexie.Table<IndexDbMint, string>;
    public items!: Dexie.Table<IndexDbItem, string>;

    constructor() {
        super('WalletsDatabase');

        try {
            // If you change any of the schemas below, please Increment INDEXED_DB_VERSION by 1!
            this.version(INDEXED_DB_VERSION).stores({
                users: '&gid, id, name, email, role, walletAddress, image, avatar, banner, roles, settings, isSelected, createdAt, updatedAt, password, hashedPassword',
                profiles:
                    '&gid, id, name, url, bio, twitter, site, email, avatarUrl, walletAddress, createdAt, updatedAt',
                wallets:
                    '&gid, chain, label, pubKey,encryptedSeedPhrase, encryptedPrivKey, balance, isSelected, privKey, seed, seedPhrase',
                mints: '&gid, walletId, mint, owner, address',
                items: '&gid, identifier, uri, image, artists, mint, link, external_url, title, seller_fee_basis_points, creators, type, category, edition, supply, maxSupply, solPrice, description, story, attributes, files, chain, publicKey, createdAt, updatedAt',
            });

            this.users = this.table('users');
            this.profiles = this.table('profiles');
            this.wallets = this.table('wallets');
            this.mints = this.table('mints');
            this.items = this.table('items');
        } catch (error) {
            console.error(`IndexDB error: ${error}`);
        }
    }

    removeAllData = async (): Promise<void> => {
        console.warn(`IndexDB: deleting database ...`);
        return await deleteDatabase(this).catch((error) => {
            console.error(`IndexDB: failed to remove database: ${error}`);
            return error;
        });
    };

    // User database functions

    removeAllUserData = async (): Promise<void> => {
        console.warn(`IndexDB: deleting all user tables ...`);
        return await clearAllUserTables(this).catch((error) => {
            console.error(`IndexDB: failed to remove user tables: ${error}`);
            return error;
        });
    };

    getSavedUsers = async (): Promise<IndexDbUser[]> => {
        console.debug(`IndexDB: getting users ...`);
        const dbUsers = await this.transaction('rw', this.users, async (): Promise<IndexDbUser[]> => {
            return await readAllUsers(this).catch((error) => {
                console.warn(`IndexDB: unable to get saved users: ${error}`);
                notify({
                    message: 'Local Storage',
                    description: 'Unable to read the local user database. Is your browser in private mode?',
                    type: 'error',
                });
                return error;
            });
        });
        return dbUsers;
    };

    getSavedUser = async (gid: string): Promise<IndexDbUser | undefined> => {
        console.debug(`IndexDB: getting user gid: ${gid} ...`);
        const dbUser = await this.transaction('rw', this.users, async (): Promise<IndexDbUser | undefined> => {
            // fetch the user
            const currentUser = await readUser(this, gid);
            console.debug(`IndexDB: fetched saved user: ${currentUser?.gid ? `gid: ${currentUser.gid}` : 'failed'}`);
            return currentUser;
        });
        return dbUser;
    };

    getSavedUserByAddress = async (walletAddress: string): Promise<IndexDbUser | undefined> => {
        console.debug(`IndexDB: getting user: ${walletAddress}`);
        const dbUsers = await this.transaction('rw', this.users, async (): Promise<IndexDbUser[]> => {
            return await loadUsersByWalletAddress(this, walletAddress);
        });
        if (hasDuplicates(dbUsers)) {
            console.warn(`IndexDB: multiple users found under wallet address: ${walletAddress}!`);
            return;
        }
        return dbUsers.find((usr) => usr.walletAddress === walletAddress);
    };

    getSavedUserByEmail = async (email: string): Promise<IndexDbUser | undefined> => {
        console.debug(`IndexDB: getting user: ${email}`);
        const usersByEmail = await loadUsersByEmail(this, email);
        if (!usersByEmail) {
            return undefined;
        }
        const dbUsers = await this.transaction('rw', this.users, async (): Promise<IndexDbUser[]> => {
            return usersByEmail;
        });
        if (hasDuplicates(dbUsers)) {
            console.warn(`IndexDB: multiple users found under email: ${email}!`);
            return;
        }
        return dbUsers.find((usr) => usr.email === email);
    };

    getSavedUserById = async (id: string): Promise<IndexDbUser | undefined> => {
        console.debug(`IndexDB: getting user id: ${id}`);
        const usersById = await loadUsersById(this, id);
        if (!usersById) {
            return undefined;
        }
        const dbUsers = await this.transaction('rw', this.users, async (): Promise<IndexDbUser[]> => {
            return usersById;
        });
        if (hasDuplicates(dbUsers)) {
            console.warn(`IndexDB: multiple users found under id: ${id}!`);
            return;
        }
        return dbUsers.find((usr) => usr.id === id);
    };

    getSavedUserMatches = async (email: string): Promise<IndexDbUser[] | undefined> => {
        console.debug(`IndexDB: getting saved users matching: ${email}`);
        const dbUsers = await this.transaction('rw', this.users, async (): Promise<IndexDbUser[]> => {
            return await loadUsersByEmail(this, email);
        });
        return dbUsers.filter((usr) => usr.email === email);
    };

    saveUser = async (apiUser: ApiUser, wallets: LocalWalletStore[]): Promise<IndexDbUser> => {
        console.debug(`IndexDB: saving user id: ${apiUser.id} ...`);
        const dbUser = await this.transaction('rw', this.users, async (): Promise<IndexDbUser> => {
            const {
                id,
                name,
                email,
                role,
                walletAddress,
                image,
                avatar,
                banner,
                roles,
                settings,
                isSelected,
                password,
                hashedPassword,
                createdAt,
                updatedAt,
            } = apiUser;
            const newUser = new IndexDbUser(
                id,
                name,
                email,
                role,
                walletAddress,
                image ?? '',
                avatar ?? '',
                banner ?? '',
                roles,
                settings,
                isSelected ?? false,
                createdAt,
                updatedAt,
                password,
                hashedPassword
            );

            // create the user
            const gid = await createUser(this, newUser);
            console.debug(`IndexDB: user saved: ${gid ? `gid: ${gid}` : 'failed'}`);
            return newUser;
        });

        // Add wallets to the new user.
        const updatedUser = {
            ...dbUser,
            gid: dbUser.gid,
            wallets: wallets,
        } as IndexDbUser;

        const update = await this.updateUser(updatedUser);
        console.debug(`IndexDB: ${dbUser.email} update: ${update ? 'succeded' : 'failed'}`);
        return updatedUser;
    };

    updateUser = async (userObject: IndexDbUser) => {
        console.debug(`IndexDB: updating user id: ${userObject.id}} ...`);
        // console.dir(userObject)
        const result = await this.transaction('rw', this.users, this.profiles, this.wallets, this.items, async () => {
            return await modifyUser(this, userObject);
            // return await amendUser(this, userObject);
        });
        return result;
    };

    removeUser = async (userObject: IndexDbUser) => {
        console.debug(`IndexDB: Removing user: ${userObject.email} ...`);
        const result = await this.transaction('rw', this.users, this.profiles, this.wallets, this.items, async () => {
            return await deleteUser(this, userObject);
        });
        return result;
    };

    getUserProfiles = async (userId: string): Promise<IndexDbProfile[]> => {
        console.debug(`IndexDB: getting profile for user id: ${userId} ...`);
        const dbProfile = await this.transaction('rw', this.users, this.profiles, async (): Promise<IndexDbProfile[]> => {
            return await loadUserProfiles(userId, this);
        });
        return dbProfile;
    };

    saveProfile = async (userId: string, apiProfile: ApiProfile) => {
        console.debug(`IndexDB: saving profile for user id: ${userId} ...`);
        const dbProfile = await this.transaction('rw', this.users, this.profiles, async () => {
            const {
                id: userId,
                name,
                url,
                bio,
                twitter,
                site,
                email,
                avatarUrl,
                walletAddress,
                createdAt,
                updatedAt,
            } = apiProfile;
            const newProfile = new IndexDbProfile(
                userId,
                name,
                url ?? '',
                bio ?? '',
                twitter ?? '',
                site ?? '',
                email ?? '',
                avatarUrl ?? '',
                walletAddress ?? '',
                createdAt,
                updatedAt
            );
            const gid = await createProfile(this, newProfile);
            console.debug(`IndexDB: profile saved: ${gid ? `gid: ${gid}` : 'failed'}`);
            // console.dir(newProfile);
            return newProfile;
        });
        return dbProfile;
    };

    updateProfile = async (userId: string, apiProfile: ApiProfile) => {
        console.debug(`IndexDB: updating profile for user id: ${userId} ...`);
        const dbProfile = await this.transaction('rw', this.users, this.profiles, async () => {
            const {
                id: userId,
                name,
                url,
                bio,
                twitter,
                site,
                email,
                avatarUrl,
                walletAddress,
                createdAt,
                updatedAt,
            } = apiProfile;
            const newProfile = new IndexDbProfile(
                userId,
                name,
                url ?? '',
                bio ?? '',
                twitter ?? '',
                site ?? '',
                email ?? '',
                avatarUrl ?? '',
                walletAddress ?? '',
                createdAt,
                updatedAt
            );
            const gid = await amendProfile(this, newProfile);
            console.debug(`IndexDB: profile updated: ${gid ? `gid: ${gid}` : 'failed'}`);
            // console.dir(newWallet);
            return newProfile;
        });
        return dbProfile;
    };

    // Wallet database functions
    getSavedWallets = async (): Promise<IndexDbWallet[]> => {
        console.debug(`IndexDB: getting saved wallets ...`);
        const dbWallet = await this.transaction('rw', this.wallets, async (): Promise<IndexDbWallet[]> => {
            return await readAllWallets(this).catch((error) => {
                console.warn(`IndexDB: Unable to get saved wallets: ${error}`);
                notify({
                    message: 'Local Storage',
                    description: 'Unable to read the local wallets database. Is your browser in private mode?',
                    type: 'error',
                });
                return error;
            });
        });
        return dbWallet;
    };

    getSavedWalletMatches = async (publicKey: string): Promise<IndexDbWallet[] | undefined> => {
        console.debug(`IndexDB: getting saved wallets matching: ${publicKey}`);
        const dbWallets = await this.transaction('rw', this.wallets, async (): Promise<IndexDbWallet[]> => {
            return await loadWalletsByPublicKey(this, publicKey);
        });
        return dbWallets.filter((wlt) => wlt.pubKey === publicKey);
    };

    getSavedWallet = async (publicKey: string): Promise<IndexDbWallet | undefined> => {
        console.debug(`IndexDB: getting saved wallet: ${publicKey}`);
        const dbWallets = await this.transaction('rw', this.wallets, async (): Promise<IndexDbWallet[]> => {
            return await loadWalletsByPublicKey(this, publicKey);
        });
        if (hasDuplicates(dbWallets)) {
            console.warn(`IndexDB: multiple dbWallets found under publicKey: ${publicKey}!`);
            return;
        }
        return dbWallets.find((usr) => usr.pubKey === publicKey);
    };

    saveWallet = async (lwallet: LocalWalletStore): Promise<IndexDbWallet> => {
        console.debug(`IndexDB: saving ${lwallet.chain} ${lwallet.label} wallet: ${lwallet.pubKey} ...`);
        const dbWallet = await this.transaction('rw', this.wallets, async (): Promise<IndexDbWallet> => {
            const {
                chain,
                label,
                pubKey,
                encryptedSeedPhrase,
                encryptedPrivKey,
                balance,
                isSelected,
                privKey,
                seed,
                seedPhrase,
            } = lwallet;

            const newWallet = new IndexDbWallet(
                chain,
                label,
                pubKey,
                encryptedSeedPhrase,
                encryptedPrivKey,
                balance,
                isSelected ?? false,
                privKey,
                seed,
                seedPhrase
            );
            const gid = await createWallet(this, newWallet);
            console.debug(`IndexDB: wallet saved: ${gid ? `gid: ${gid}` : 'failed'}`);
            // console.dir(newWallet);
            return newWallet;
        });
        return dbWallet;
    };

    updateWallet = async (walletObject: IndexDbWallet) => {
        console.debug(`IndexDB: updating wallet: ${walletObject.pubKey}}...`);
        const result = await this.transaction('rw', this.users, this.profiles, this.wallets, this.items, async () => {
            return await modifyWallet(this, walletObject);
            // return await amendWallet(this, walletObject);
        });
        return result;
    };

    removeWallet = async (walletObject: IndexDbWallet) => {
        console.debug(`IndexDB: Removing wallet: ${walletObject.chain} ${walletObject.label} ${walletObject.pubKey} ...`);
        const result = await this.transaction('rw', this.users, this.profiles, this.wallets, this.items, async () => {
            return await deleteWallet(this, walletObject);
        });
        return result;
    };

    getSavedMints = async (walletId: string): Promise<IndexDbMint[]> => {
        console.debug(`IndexDB: getting wallet ${walletId} mints ...`);
        const dbMint = await this.transaction('rw', this.wallets, this.mints, async (): Promise<IndexDbMint[]> => {
            return await loadWalletMints(walletId, this).catch((error) => {
                console.warn(`IndexDB: Unable to get saved mints: ${error}`);
                notify({
                    message: 'Local Storage',
                    description: 'Unable to read the local mints database. Is your browser in private mode?',
                    type: 'error',
                });
                return error;
            });
        });
        return dbMint;
    };

    saveMint = async (id: string, lMint: LocalMintStore) => {
        console.debug(`IndexDB: saving mint ${id} ...`);
        const newMint = await this.transaction('rw', this.wallets, this.mints, async () => {
            const { mint, owner, address } = lMint;
            const newMint = new IndexDbMint(id, mint, owner, address);
            const gid = await createMint(this, newMint);
            console.debug(`IndexDB: mint saved: ${gid ? `gid: ${gid}` : 'failed'}`);
        });

        return newMint;
    };

    getUserWallets = async (userId: string): Promise<IndexDbWallet[]> => {
        console.debug(`IndexDB: getting wallets for user id: ${userId} ...`);
        const dbWallet = await this.transaction('rw', this.users, this.wallets, async (): Promise<IndexDbWallet[]> => {
            return await loadUserWallets(userId, this);
        });
        return dbWallet;
    };

    // Item database functions
    getSavedItems = async (): Promise<IndexDbItem[]> => {
        console.debug(`IndexDB: getting saved items ...`);
        const dbItems = await this.transaction('rw', this.items, async (): Promise<IndexDbItem[]> => {
            return await readAllItems(this).catch((error) => {
                console.warn(`IndexDB: Unable to get saved items: ${error}`);
                notify({
                    message: 'Local Storage',
                    description: 'Unable to read the local items database. Is your browser in private mode?',
                    type: 'error',
                });
                return error;
            });
        });
        return dbItems;
    };

    saveItem = async (apiItem: ApiItem): Promise<IndexDbItem> => {
        console.debug(`IndexDB: saving item: ${apiItem.id} ...`);
        const dbItem = await this.transaction('rw', this.items, async (): Promise<IndexDbItem> => {
            const {
                id,
                identifier,
                uri,
                image,
                artists,
                mint,
                link,
                external_url,
                title,
                seller_fee_basis_points,
                creators,
                type,
                category,
                edition,
                supply,
                maxSupply,
                solPrice,
                description,
                story,
                attributes,
                files,
                chain,
                tokenMint,
                publicKey,
                createdAt,
                updatedAt,
            } = apiItem;

            if (
                edition === undefined ||
                supply === undefined ||
                maxSupply === undefined ||
                seller_fee_basis_points === undefined
            ) {
                throw new Error('Required values are undefined');
            }

            const newItem = new IndexDbItem(
                id,
                identifier,
                uri,
                image,
                artists ?? [],
                mint,
                link ?? '',
                external_url ?? '',
                title,
                seller_fee_basis_points,
                creators ?? [],
                type ?? ArtType.NFT,
                category,
                edition,
                supply,
                maxSupply,
                solPrice,
                description ?? '',
                story ?? '',
                attributes ?? [],
                files ?? [],
                chain,
                tokenMint ?? '',
                publicKey ?? '',
                createdAt, // If these may be undefined, consider handling them
                updatedAt // If these may be undefined, consider handling them
            );
            const gid = await createItem(this, newItem);
            console.debug(`IndexDB: item saved: ${gid ? `gid: ${gid}` : 'failed'}`);
            return newItem;
        });
        return dbItem;
    };

    updateItem = async (itemId: string, apiItem: IndexDbItem) => {
        console.debug(`IndexDB: updating item: ${itemId}} ...`);
        const dbItem = await this.transaction('rw', this.items, async () => {
            const {
                id,
                identifier,
                uri,
                image,
                artists,
                mint,
                link,
                external_url,
                title,
                seller_fee_basis_points,
                creators,
                type,
                category,
                edition,
                supply,
                maxSupply,
                solPrice,
                description,
                story,
                attributes,
                files,
                chain,
                tokenMint,
                publicKey,
                createdAt,
                updatedAt,
            } = apiItem;

            if (
                seller_fee_basis_points === undefined ||
                edition === undefined ||
                supply === undefined ||
                maxSupply === undefined ||
                attributes === undefined ||
                files === undefined ||
                createdAt === undefined ||
                updatedAt === undefined
            ) {
                throw new Error('Some required fields are undefined');
            }

            const newItem = new IndexDbItem(
                id,
                identifier,
                uri,
                image,
                artists,
                mint,
                link,
                external_url,
                title,
                seller_fee_basis_points,
                creators,
                type,
                category,
                edition,
                supply,
                maxSupply,
                solPrice,
                description,
                story,
                attributes,
                files,
                chain,
                tokenMint,
                publicKey,
                createdAt,
                updatedAt
            );
            const gid = await amendItem(this, newItem);
            console.debug(`IndexDB: item updated: ${gid ? `gid: ${gid}` : 'failed'}`);
            return newItem;
        });
        return dbItem;
    };

    getUserItems = async (userId: string): Promise<IndexDbItem[]> => {
        console.debug(`IndexDB: getting profile for user: ${userId} ...`);
        const dbItem = await this.transaction('rw', this.users, this.items, async (): Promise<IndexDbItem[]> => {
            return await loadUserItems(userId, this);
        });
        return dbItem;
    };
}
