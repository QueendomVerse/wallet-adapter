import type { ApiItem, ApiProfile, ApiUser, LocalMintStore, LocalWalletStore } from '@mindblox-wallet-adapter/base';
import { ArtType } from '@mindblox-wallet-adapter/base';
import { notify } from '@mindblox-wallet-adapter/react';

import {
    deleteDatabase,
    readAllUsers,
    clearAllUserTables,
    loadUserProfiles,
    loadWalletsByPublicKey,
    loadUsersByWalletAddress,
    loadUsersByEmail,
    loadUsersById,
    loadUserWallets,
    createUser,
    readUser,
    // amendUser,
    modifyUser,
    // addUserWallet,
    // createProfile,
    // amendProfile,
    readAllWallets,
    loadWalletMints,
    createWallet,
    // readWallet,
    // amendWallet,
    modifyWallet,
    deleteWallet,
    createMint,
    amendItem,
    createItem,
    loadUserItems,
    readAllItems,
    createProfile,
    deleteUser,
    amendProfile,
} from './utils';
import { IndexDbProfile } from './db';
import { db, IndexDbUser, IndexDbWallet, IndexDbMint, IndexDbItem } from './db';

// Interfaces
// Helper functions

const hasDuplicates = <T>(arr: T[]): boolean => (arr.length > 1 ? true : false);

// General database functions

export const removeAllData = async (): Promise<void> => {
    console.warn(`IndexDB: deleting database ...`);
    return await deleteDatabase(db).catch((error) => {
        console.error(`IndexDB: failed to remove database: ${error}`);
        return error;
    });
};

// User database functions

export const removeAllUserData = async (): Promise<void> => {
    console.warn(`IndexDB: deleting all user tables ...`);
    return await clearAllUserTables(db).catch((error) => {
        console.error(`IndexDB: failed to remove user tables: ${error}`);
        return error;
    });
};

export const getSavedUsers = async (): Promise<IndexDbUser[]> => {
    console.debug(`IndexDB: getting users ...`);
    const dbUsers = await db.transaction('rw', db.users, async (): Promise<IndexDbUser[]> => {
        return await readAllUsers(db).catch((error) => {
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

export const getSavedUser = async (gid: string): Promise<IndexDbUser | undefined> => {
    console.debug(`IndexDB: getting user gid: ${gid} ...`);
    const dbUser = await db.transaction('rw', db.users, async (): Promise<IndexDbUser | undefined> => {
        // fetch the user
        const currentUser = await readUser(db, gid);
        console.debug(`IndexDB: fetched saved user: ${currentUser?.gid ? `gid: ${currentUser.gid}` : 'failed'}`);
        return currentUser;
    });
    return dbUser;
};

export const getSavedUserByAddress = async (walletAddress: string): Promise<IndexDbUser | undefined> => {
    console.debug(`IndexDB: getting user: ${walletAddress}`);
    const dbUsers = await db.transaction('rw', db.users, async (): Promise<IndexDbUser[]> => {
        return await loadUsersByWalletAddress(db, walletAddress);
    });
    if (hasDuplicates(dbUsers)) {
        console.warn(`IndexDB: multiple users found under wallet address: ${walletAddress}!`);
        return;
    }
    return dbUsers.find((usr) => usr.walletAddress === walletAddress);
};

export const getSavedUserByEmail = async (email: string): Promise<IndexDbUser | undefined> => {
    console.debug(`IndexDB: getting user: ${email}`);
    const usersByEmail = await loadUsersByEmail(db, email);
    if (!usersByEmail) {
        return undefined;
    }
    const dbUsers = await db.transaction('rw', db.users, async (): Promise<IndexDbUser[]> => {
        return usersByEmail;
    });
    if (hasDuplicates(dbUsers)) {
        console.warn(`IndexDB: multiple users found under email: ${email}!`);
        return;
    }
    return dbUsers.find((usr) => usr.email === email);
};

export const getSavedUserById = async (id: string): Promise<IndexDbUser | undefined> => {
    console.debug(`IndexDB: getting user id: ${id}`);
    const usersById = await loadUsersById(db, id);
    if (!usersById) {
        return undefined;
    }
    const dbUsers = await db.transaction('rw', db.users, async (): Promise<IndexDbUser[]> => {
        return usersById;
    });
    if (hasDuplicates(dbUsers)) {
        console.warn(`IndexDB: multiple users found under id: ${id}!`);
        return;
    }
    return dbUsers.find((usr) => usr.id === id);
};

export const getSavedUserMatches = async (email: string): Promise<IndexDbUser[] | undefined> => {
    console.debug(`IndexDB: getting saved users matching: ${email}`);
    const dbUsers = await db.transaction('rw', db.users, async (): Promise<IndexDbUser[]> => {
        return await loadUsersByEmail(db, email);
    });
    return dbUsers.filter((usr) => usr.email === email);
};

export const saveUser = async (apiUser: ApiUser, wallets: LocalWalletStore[]): Promise<IndexDbUser> => {
    console.debug(`IndexDB: saving user id: ${apiUser.id} ...`);
    const dbUser = await db.transaction('rw', db.users, async (): Promise<IndexDbUser> => {
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
        const gid = await createUser(db, newUser);
        console.debug(`IndexDB: user saved: ${gid ? `gid: ${gid}` : 'failed'}`);
        return newUser;
    });

    // Add wallets to the new user.
    const updatedUser = {
        ...dbUser,
        gid: dbUser.gid,
        wallets: wallets,
    } as IndexDbUser;

    const update = await updateUser(updatedUser);
    console.debug(`IndexDB: ${dbUser.email} update: ${update ? 'succeded' : 'failed'}`);
    return updatedUser;
};

export const updateUser = async (userObject: IndexDbUser) => {
    console.debug(`IndexDB: updating user id: ${userObject.id}} ...`);
    // console.dir(userObject)
    const result = await db.transaction('rw', db.users, db.profiles, db.wallets, db.items, async () => {
        return await modifyUser(db, userObject);
        // return await amendUser(db, userObject);
    });
    return result;
};

export const removeUser = async (userObject: IndexDbUser) => {
    console.debug(`IndexDB: Removing user: ${userObject.email} ...`);
    const result = await db.transaction('rw', db.users, db.profiles, db.wallets, db.items, async () => {
        return await deleteUser(db, userObject);
    });
    return result;
};

export const getUserProfiles = async (userId: string): Promise<IndexDbProfile[]> => {
    console.debug(`IndexDB: getting profile for user id: ${userId} ...`);
    const dbProfile = await db.transaction('rw', db.users, db.profiles, async (): Promise<IndexDbProfile[]> => {
        return await loadUserProfiles(userId, db);
    });
    return dbProfile;
};

export const saveProfile = async (userId: string, apiProfile: ApiProfile) => {
    console.debug(`IndexDB: saving profile for user id: ${userId} ...`);
    const dbProfile = await db.transaction('rw', db.users, db.profiles, async () => {
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
        const gid = await createProfile(db, newProfile);
        console.debug(`IndexDB: profile saved: ${gid ? `gid: ${gid}` : 'failed'}`);
        // console.dir(newProfile);
        return newProfile;
    });
    return dbProfile;
};

export const updateProfile = async (userId: string, apiProfile: ApiProfile) => {
    console.debug(`IndexDB: updating profile for user id: ${userId} ...`);
    const dbProfile = await db.transaction('rw', db.users, db.profiles, async () => {
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
        const gid = await amendProfile(db, newProfile);
        console.debug(`IndexDB: profile updated: ${gid ? `gid: ${gid}` : 'failed'}`);
        // console.dir(newWallet);
        return newProfile;
    });
    return dbProfile;
};

// Wallet database functions
export const getSavedWallets = async (): Promise<IndexDbWallet[]> => {
    console.debug(`IndexDB: getting saved wallets ...`);
    const dbWallet = await db.transaction('rw', db.wallets, async (): Promise<IndexDbWallet[]> => {
        return await readAllWallets(db).catch((error) => {
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

export const getSavedWalletMatches = async (publicKey: string): Promise<IndexDbWallet[] | undefined> => {
    console.debug(`IndexDB: getting saved wallets matching: ${publicKey}`);
    const dbWallets = await db.transaction('rw', db.wallets, async (): Promise<IndexDbWallet[]> => {
        return await loadWalletsByPublicKey(db, publicKey);
    });
    return dbWallets.filter((wlt) => wlt.pubKey === publicKey);
};

export const getSavedWallet = async (publicKey: string): Promise<IndexDbWallet | undefined> => {
    console.debug(`IndexDB: getting saved wallet: ${publicKey}`);
    const dbWallets = await db.transaction('rw', db.wallets, async (): Promise<IndexDbWallet[]> => {
        return await loadWalletsByPublicKey(db, publicKey);
    });
    if (hasDuplicates(dbWallets)) {
        console.warn(`IndexDB: multiple dbWallets found under publicKey: ${publicKey}!`);
        return;
    }
    return dbWallets.find((usr) => usr.pubKey === publicKey);
};

export const saveWallet = async (lwallet: LocalWalletStore): Promise<IndexDbWallet> => {
    console.debug(`IndexDB: saving ${lwallet.chain} ${lwallet.label} wallet: ${lwallet.pubKey} ...`);
    const dbWallet = await db.transaction('rw', db.wallets, async (): Promise<IndexDbWallet> => {
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
        const gid = await createWallet(db, newWallet);
        console.debug(`IndexDB: wallet saved: ${gid ? `gid: ${gid}` : 'failed'}`);
        // console.dir(newWallet);
        return newWallet;
    });
    return dbWallet;
};

export const updateWallet = async (walletObject: IndexDbWallet) => {
    console.debug(`IndexDB: updating wallet: ${walletObject.pubKey}}...`);
    const result = await db.transaction('rw', db.users, db.profiles, db.wallets, db.items, async () => {
        return await modifyWallet(db, walletObject);
        // return await amendWallet(db, walletObject);
    });
    return result;
};

export const removeWallet = async (walletObject: IndexDbWallet) => {
    console.debug(`IndexDB: Removing wallet: ${walletObject.chain} ${walletObject.label} ${walletObject.pubKey} ...`);
    const result = await db.transaction('rw', db.users, db.profiles, db.wallets, db.items, async () => {
        return await deleteWallet(db, walletObject);
    });
    return result;
};

export const getSavedMints = async (walletId: string): Promise<IndexDbMint[]> => {
    console.debug(`IndexDB: getting wallet ${walletId} mints ...`);
    const dbMint = await db.transaction('rw', db.wallets, db.mints, async (): Promise<IndexDbMint[]> => {
        return await loadWalletMints(walletId, db).catch((error) => {
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

export const saveMint = async (id: string, lMint: LocalMintStore) => {
    console.debug(`IndexDB: saving mint ${id} ...`);
    const newMint = await db.transaction('rw', db.wallets, db.mints, async () => {
        const { mint, owner, address } = lMint;
        const newMint = new IndexDbMint(id, mint, owner, address);
        const gid = await createMint(db, newMint);
        console.debug(`IndexDB: mint saved: ${gid ? `gid: ${gid}` : 'failed'}`);
    });

    return newMint;
};

export const getUserWallets = async (userId: string): Promise<IndexDbWallet[]> => {
    console.debug(`IndexDB: getting wallets for user id: ${userId} ...`);
    const dbWallet = await db.transaction('rw', db.users, db.wallets, async (): Promise<IndexDbWallet[]> => {
        return await loadUserWallets(userId, db);
    });
    return dbWallet;
};

// Item database functions
export const getSavedItems = async (): Promise<IndexDbItem[]> => {
    console.debug(`IndexDB: getting saved items ...`);
    const dbItems = await db.transaction('rw', db.items, async (): Promise<IndexDbItem[]> => {
        return await readAllItems(db).catch((error) => {
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

export const saveItem = async (apiItem: ApiItem): Promise<IndexDbItem> => {
    console.debug(`IndexDB: saving item: ${apiItem.id} ...`);
    const dbItem = await db.transaction('rw', db.items, async (): Promise<IndexDbItem> => {
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
        const gid = await createItem(db, newItem);
        console.debug(`IndexDB: item saved: ${gid ? `gid: ${gid}` : 'failed'}`);
        return newItem;
    });
    return dbItem;
};

export const updateItem = async (itemId: string, apiItem: IndexDbItem) => {
    console.debug(`IndexDB: updating item: ${itemId}} ...`);
    const dbItem = await db.transaction('rw', db.items, async () => {
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
        const gid = await amendItem(db, newItem);
        console.debug(`IndexDB: item updated: ${gid ? `gid: ${gid}` : 'failed'}`);
        return newItem;
    });
    return dbItem;
};
export const getUserItems = async (userId: string): Promise<IndexDbItem[]> => {
    console.debug(`IndexDB: getting profile for user: ${userId} ...`);
    const dbItem = await db.transaction('rw', db.users, db.items, async (): Promise<IndexDbItem[]> => {
        return await loadUserItems(userId, db);
    });
    return dbItem;
};
