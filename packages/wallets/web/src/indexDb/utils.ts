import { WalletDatabaseError, printError } from '@mindblox-wallet-adapter/base';
import type { IndexDbAppDatabase, IndexDbUser, IndexDbProfile } from './db';
import { IndexDbWallet, IndexDbMint } from './db';
import Dexie from 'dexie';

const getArray = async (col: Dexie.Collection | Dexie.Table) => {
    const arr = await col
        .toArray()
        .then()
        .catch(Dexie.SchemaError, (e) => {
            printError(`Schema Error: ${e}`, WalletDatabaseError);
        })
        .catch((e: unknown) => {
            printError(e, Error);
        });
    return arr ?? [];
};

// General Database Functions
/**
 * Delete the entire database
 */
export const deleteDatabase = async (db: IndexDbAppDatabase) => {
    await db.delete();
};

/**
 * Open a  database
 */
export const openDatabase = async (db: IndexDbAppDatabase) => {
    await db.open();
};

// Users Database Functions
/**
 * Clear all IndexDbUser tables
 */
export const clearAllUserTables = async (db: IndexDbAppDatabase) => {
    await Promise.all([db.users.clear()]);
};

/**
 * Read all Users
 */
export const readAllUsers = async (db: IndexDbAppDatabase): Promise<IndexDbUser[]> => {
    return await getArray(db.users);
};

/**
 * Create a IndexDbUser
 *
 * Note that since the user is guaranteed
 * to have a unique ID we are using `put`
 * to update the database.
 */
export const createUser = async (db: IndexDbAppDatabase, user: IndexDbUser): Promise<string> => {
    return await db.users.put(user);
};

/**
 * Read a IndexDbUser
 */
export const readUser = async (db: IndexDbAppDatabase, userGID: string): Promise<IndexDbUser | undefined> => {
    return await db.users.get(userGID);
};

/**
 * Load Wallets records and
 * update the corresponding user id fields.
 */
export const loadUsersByWalletAddress = async (
    db: IndexDbAppDatabase,
    walletAddress: string
): Promise<IndexDbUser[]> => {
    console.debug('pulling user', walletAddress);
    return await getArray(db.users.where('walletAddress').equals(walletAddress));
};

export const loadUsersByEmail = async (db: IndexDbAppDatabase, email: string): Promise<IndexDbUser[]> => {
    console.debug('pulling user', email);
    return await getArray(db.users.where('email').equals(email));
};

export const loadUsersById = async (db: IndexDbAppDatabase, id: string): Promise<IndexDbUser[]> => {
    console.debug('pulling user', id);
    return await getArray(db.users.where('id').equals(id));
};

/**
 * Update a IndexDbUser
 */
// export const amendUser = async (db: IndexDbAppDatabase, user: IndexDbUser) => {
//   console.debug(`amending user: ${user.id}`)
//   console.dir(user)
//   const result = await db.users.put(user);
//   console.debug('amenduser result');
//   console.dir(result)
//   return result;
// };

export const amendUser = async (db: IndexDbAppDatabase, user: IndexDbUser) => {
    if (!user || user.gid) return;

    console.debug(`amending user: ${user.gid} - ${user.isSelected}`);

    db.users.orderBy('id').eachPrimaryKey((primaryKey) => {
        console.debug(`${primaryKey} - ${user.gid}`);
        if (String(primaryKey) === user.gid) {
            console.debug('userKey matched!');
            db.users.update(primaryKey, { isSelected: user.isSelected }).then((updated) => {
                if (updated) console.debug(`user.isSelected was changed to: ${user.isSelected}`);
                else console.debug(`Nothing was updated - there were no user with primary key: ${user.gid}`);
            });
        }
    });
    return await db.users.get(user.id);
};

/**
 * Update a IndexDbUser
 */
export const modifyUser = async (db: IndexDbAppDatabase, user: IndexDbUser) => {
    if (!user.gid) throw new Error(`${user.email} gid not found!`);

    console.debug(`DB gid(${user.gid}): changing user ${user.email} selection-> ${user.isSelected}`);
    // return await db.users.update(user.gid, {
    //   isSelected: user.isSelected,
    //   wallets: user.wallets,
    // });
    return await db.users.update(user.gid, user);
};

export const addUserWallet = async (db: IndexDbAppDatabase, user: IndexDbUser) => {
    if (!user.gid) throw new Error(`${user.email} gid not found!`);
    if (!user.wallets) throw new Error(`${user.email} has no wallets!`);

    console.debug(
        `DB gid(${user.gid}): changing user ${user.email} wallets -> ${user.wallets.map((w) => {
            `${w.chain}: ${w.pubKey}`;
        })}`
    );
    return await db.users.update(user.gid, {
        wallets: user.wallets,
    });
};

/**
 * Create a IndexDbProfile
 *
 * Note that since the profile is guaranteed
 * to have a unique ID we are using `put`
 * to update the databse.
 */
export const createProfile = async (db: IndexDbAppDatabase, profile: IndexDbProfile): Promise<string> => {
    return await db.profiles.put(profile);
};

/**
 * Read a IndexDbProfile
 */
export const readProfile = async (db: IndexDbAppDatabase, profileGID: string) => {
    return await db.profiles.get(profileGID);
};

/**
 * Update IndexDbProfile
 */
export const amendProfile = async (db: IndexDbAppDatabase, profile: IndexDbProfile) => {
    return await db.profiles.put(profile);
};

/**
 * Load IndexDbProfile records and
 * update the corresponding user id fields.
 */
export const loadUserProfiles = async (userGID: string, db: IndexDbAppDatabase): Promise<IndexDbProfile[]> => {
    return await getArray(db.profiles.where('userGID').equals(userGID));
};

// Wallets Database Functions
/**
 * Clear all IndexDbWallet tables
 */
export const clearAllWalletTables = async (db: IndexDbAppDatabase) => {
    await Promise.all([db.wallets.clear()]);
};

/**
 * Read all Wallets
 */
export const readAllWallets = async (db: IndexDbAppDatabase): Promise<IndexDbWallet[]> => {
    return await getArray(db.wallets);
};

/**
 * Load Wallets records and
 * update the corresponding user id fields.
 */
export const loadUserWallets = async (userGID: string, db: IndexDbAppDatabase): Promise<IndexDbWallet[]> => {
    return await getArray(db.wallets.where('userGID').equals(userGID));
};

/**
 * Load Wallets records and
 * update the corresponding user id fields.
 */
export const loadWalletsByPublicKey = async (db: IndexDbAppDatabase, pubKey: string): Promise<IndexDbWallet[]> => {
    return await getArray(db.wallets.where('pubKey').equals(pubKey));
};

/**
 * Create a IndexDbWallet
 *
 * Note that since the wallet is guaranteed
 * to have a unique ID we are using `put`
 * to update the databse.
 */
export const createWallet = async (db: IndexDbAppDatabase, wallet: IndexDbWallet): Promise<string> => {
    return await db.wallets.put(wallet);
};

/**
 * Read a IndexDbWallet
 */
export const readWallet = async (db: IndexDbAppDatabase, walletGID: string): Promise<IndexDbWallet | undefined> => {
    return await db.wallets.get(walletGID);
};

/**
 * Update a IndexDbWallet
 */
export const amendWallet = async (db: IndexDbAppDatabase, wallet: IndexDbWallet) => {
    console.debug('amending wallet', `'${wallet.gid}'`);
    if (!wallet || !wallet.gid) return;
    console.debug('amending wallet 2');

    console.debug(`amending wallet: ${wallet.gid} - ${wallet.isSelected}`);

    db.wallets.orderBy('pubKey').eachPrimaryKey((primaryKey) => {
        console.debug(`${primaryKey} - ${wallet.gid}`);
        if (String(primaryKey) === wallet.gid) {
            console.debug('walletKey matched!');
            db.wallets.update(primaryKey, { isSelected: wallet.isSelected }).then((updated) => {
                if (updated) console.debug(`wallet.isSelected was changed to: ${wallet.isSelected}`);
                else console.debug(`Nothing was updated - there were no wallet with primary key: ${wallet.gid}`);
            });
        }
    });
    return await db.wallets.get(wallet.gid);
};

/**
 * Update a IndexDbWallet
 */
export const modifyWallet = async (db: IndexDbAppDatabase, wallet: IndexDbWallet) => {
    if (!wallet.gid) throw new Error(`${wallet.chain} ${wallet.label} ${wallet.pubKey} gid not found!`);

    console.debug(
        `DB gid(${wallet.gid}): changing wallet (${wallet.pubKey}): ${wallet.label} selection -> ${wallet.isSelected}`
    );
    console.debug(
        `DB gid(${wallet.gid}): changing wallet (${wallet.pubKey}): ${
            wallet.label
        } privKey -> ${wallet.privKey?.valueOf()}`
    );
    console.debug(
        `DB gid(${wallet.gid}): changing wallet (${wallet.pubKey}): ${wallet.label} seed -> ${wallet.seed?.valueOf()}`
    );
    console.debug(
        `DB gid(${wallet.gid}): changing wallet (${wallet.pubKey}): ${wallet.label} seedPhrase -> ${wallet.seedPhrase}`
    );
    return await db.wallets.update(wallet.gid, wallet);
};

/**
 * Delete a IndexDbWallet
 */
export const deleteWallet = async (db: IndexDbAppDatabase, wallet: IndexDbWallet) => {
    console.warn('func: deleteWallet');
    console.dir(wallet);
    if (!wallet.gid) throw new Error(`${wallet.chain} ${wallet.label} ${wallet.pubKey} gid not found!`);
    console.debug(`removing wallet: ${wallet.label}`);
    // console.debug(`wallet gid: ${wallet.gid}`);
    await db.wallets.delete(wallet.gid);
    return (await db.wallets.get(wallet.gid)) ? false : true;
};

/**
 * Delete a IndexDbUser
 */
export const deleteUser = async (db: IndexDbAppDatabase, user: IndexDbUser) => {
    if (!user.gid) throw new Error(`${user.email} gid not found!`);
    console.debug(`removing user: ${user.email}`);
    // console.debug(`user gid: ${user.gid}`);
    await db.users.delete(user.gid);
    return (await db.users.get(user.gid)) ? false : true;
};

/**
 * Delete a IndexDbProfile
 */
export const deleteProfile = async (db: IndexDbAppDatabase, profile: IndexDbProfile) => {
    if (!profile.gid) return;
    console.debug(`removing profile: ${profile.email}`);
    console.debug(`profile gid: ${profile.gid}`);
    await db.profiles.delete(profile.gid);
    return (await db.profiles.get(profile.gid)) ? false : true;
};

/**
 * Create a IndexDbMint
 *
 * Note that since the mint is guaranteed
 * to have a unique ID we are using `put`
 * to update the databse.
 */
export const createMint = async (db: IndexDbAppDatabase, mint: IndexDbMint) => {
    return await db.mints.put(mint);
};

/**
 * Load IndexDbMint records and
 * update the corresponding IndexDbWallet id fields.
 */
export const loadWalletMints = async (walletGID: string, db: IndexDbAppDatabase): Promise<IndexDbMint[]> => {
    return await getArray(db.mints.where('walletId').equals(walletGID));
};

export const saveDbWallet = async (wallet: IndexDbWallet, db: IndexDbAppDatabase): Promise<string> => {
    return await db.transaction('rw', db.wallets, async (): Promise<string> => {
        const { chain, label, pubKey, encryptedSeedPhrase, encryptedPrivKey, balance, privKey, seed, seedPhrase } =
            wallet;
        const isSelected = true;
        const newWallet = new IndexDbWallet(
            chain,
            label,
            pubKey,
            encryptedSeedPhrase,
            encryptedPrivKey,
            balance,
            isSelected,
            privKey,
            seed,
            seedPhrase
        );

        return await createWallet(db, newWallet);
    });
};

export const saveDbMint = async (id: string, mintObject: IndexDbMint, db: IndexDbAppDatabase) => {
    await db.transaction('rw', db.wallets, db.mints, async () => {
        const { mint, owner, address } = mintObject;
        await createMint(db, new IndexDbMint(id, mint, owner, address));
    });
};

export const getSavedDbWallets = async (db: IndexDbAppDatabase): Promise<IndexDbWallet[] | void> => {
    return await db.transaction('rw', db.wallets, async (): Promise<IndexDbWallet[] | void> => {
        return await readAllWallets(db);
    });
};

export const getSavedDbMints = async (walletId: string, db: IndexDbAppDatabase): Promise<IndexDbMint[] | void> => {
    return await db.transaction('rw', db.wallets, db.mints, async (): Promise<IndexDbMint[] | void> => {
        return await loadWalletMints(walletId, db);
    });
};
