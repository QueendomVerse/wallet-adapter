import { AppDatabase, User, Profile, Wallet, Mint, Item } from "./db";
import Dexie from "dexie";

const getArray = async (col: Dexie.Collection | Dexie.Table) => {
  const arr = await col
    .toArray()
    .then()
    .catch(Dexie.SchemaError, (e: any) => {
      console.error("Schema Error: ", e.message);
    })
    .catch(Error, (e: any) => {
      console.error("Error: ", e.message);
    })
    .catch((e: any) => {
      console.error(e);
    });
  return arr ?? [];
};

// General Database Functions
/**
 * Delete the entire database
 */
export const deleteDatabase = async (db: AppDatabase) => {
  await db.delete();
};

/**
 * Open a  database
 */
export const openDatabase = async (db: AppDatabase) => {
  await db.open();
};

// Users Database Functions
/**
 * Clear all User tables
 */
export const clearAllUserTables = async (db: AppDatabase) => {
  await Promise.all([db.users.clear()]);
};

/**
 * Read all Users
 */
export const readAllUsers = async (db: AppDatabase): Promise<User[]> => {
  return await getArray(db.users);
};

/**
 * Create a User
 *
 * Note that since the user is guaranteed
 * to have a unique ID we are using `put`
 * to update the database.
 */
export const createUser = async (
  db: AppDatabase,
  user: User
): Promise<string> => {
  return await db.users.put(user);
};

/**
 * Read a User
 */
export const readUser = async (
  db: AppDatabase,
  userGID: string
): Promise<User | undefined> => {
  return await db.users.get(userGID);
};

/**
 * Load Wallets records and
 * update the corresponding user id fields.
 */
export const loadUsersByWalletAddress = async (
  db: AppDatabase,
  walletAddress: string
): Promise<User[]> => {
  console.debug("pulling user", walletAddress);
  return await getArray(db.users.where("walletAddress").equals(walletAddress));
};

export const loadUsersByEmail = async (
  db: AppDatabase,
  email: string
): Promise<User[]> => {
  console.debug("pulling user", email);
  return await getArray(db.users.where("email").equals(email));
};

export const loadUsersById = async (
  db: AppDatabase,
  id: string
): Promise<User[]> => {
  console.debug("pulling user", id);
  return await getArray(db.users.where("id").equals(id));
};

/**
 * Update a User
 */
// export const amendUser = async (db: AppDatabase, user: User) => {
//   console.debug(`amending user: ${user.id}`)
//   console.dir(user)
//   const result = await db.users.put(user);
//   console.debug('amenduser result');
//   console.dir(result)
//   return result;
// };

export const amendUser = async (db: AppDatabase, user: User) => {
  if (!user || user.gid) return;

  console.debug(`amending user: ${user.gid} - ${user.isSelected}`);

  db.users.orderBy("id").eachPrimaryKey(function (primaryKey) {
    console.debug(`${primaryKey} - ${user.gid}`);
    if (String(primaryKey) === user.gid) {
      console.debug("userKey matched!");
      db.users
        .update(primaryKey, { isSelected: user.isSelected })
        .then(function (updated) {
          if (updated)
            console.debug(`user.isSelected was changed to: ${user.isSelected}`);
          else
            console.debug(
              `Nothing was updated - there were no user with primary key: ${user.gid}`
            );
        });
    }
  });
  return await db.users.get(user.id);
};

/**
 * Update a User
 */
export const modifyUser = async (db: AppDatabase, user: User) => {
  if (!user.gid) throw new Error(`${user.email} gid not found!`);

  console.debug(
    `DB gid(${user.gid}): changing user ${user.email} selection-> ${user.isSelected}`
  );
  // return await db.users.update(user.gid, {
  //   isSelected: user.isSelected,
  //   wallets: user.wallets,
  // });
  return await db.users.update(user.gid, user);
};

export const addUserWallet = async (db: AppDatabase, user: User) => {
  if (!user.gid) throw new Error(`${user.email} gid not found!`);
  if (!user.wallets) throw new Error(`${user.email} has no wallets!`);

  console.debug(
    `DB gid(${user.gid}): changing user ${
      user.email
    } wallets -> ${user.wallets.map((w) => {
      `${w.chain}: ${w.pubKey}`;
    })}`
  );
  return await db.users.update(user.gid, {
    wallets: user.wallets,
  });
};

/**
 * Create a Profile
 *
 * Note that since the profile is guaranteed
 * to have a unique ID we are using `put`
 * to update the databse.
 */
export const createProfile = async (
  db: AppDatabase,
  profile: Profile
): Promise<string> => {
  return await db.profiles.put(profile);
};

/**
 * Read a Profile
 */
export const readProfile = async (db: AppDatabase, profileGID: string) => {
  return await db.profiles.get(profileGID);
};

/**
 * Update Profile
 */
export const amendProfile = async (db: AppDatabase, profile: Profile) => {
  return await db.profiles.put(profile);
};

/**
 * Load Profile records and
 * update the corresponding user id fields.
 */
export const loadUserProfiles = async (
  userGID: string,
  db: AppDatabase
): Promise<Profile[]> => {
  return await getArray(db.profiles.where("userGID").equals(userGID));
};

// Wallets Database Functions
/**
 * Clear all Wallet tables
 */
export const clearAllWalletTables = async (db: AppDatabase) => {
  await Promise.all([db.wallets.clear()]);
};

/**
 * Read all Wallets
 */
export const readAllWallets = async (db: AppDatabase): Promise<Wallet[]> => {
  return await getArray(db.wallets);
};

/**
 * Load Wallets records and
 * update the corresponding user id fields.
 */
export const loadUserWallets = async (
  userGID: string,
  db: AppDatabase
): Promise<Wallet[]> => {
  return await getArray(db.wallets.where("userGID").equals(userGID));
};

/**
 * Load Wallets records and
 * update the corresponding user id fields.
 */
export const loadWalletsByPublicKey = async (
  db: AppDatabase,
  pubKey: string
): Promise<Wallet[]> => {
  return await getArray(db.wallets.where("pubKey").equals(pubKey));
};

/**
 * Create a Wallet
 *
 * Note that since the wallet is guaranteed
 * to have a unique ID we are using `put`
 * to update the databse.
 */
export const createWallet = async (
  db: AppDatabase,
  wallet: Wallet
): Promise<string> => {
  return await db.wallets.put(wallet);
};

/**
 * Read a Wallet
 */
export const readWallet = async (
  db: AppDatabase,
  walletGID: string
): Promise<Wallet | undefined> => {
  return await db.wallets.get(walletGID);
};

/**
 * Update a Wallet
 */
export const amendWallet = async (db: AppDatabase, wallet: Wallet) => {
  console.error("amending wallet", `'${wallet.gid}'`);
  if (!wallet || !wallet.gid) return;
  console.error("amending wallet 2");

  console.debug(`amending wallet: ${wallet.gid} - ${wallet.isSelected}`);

  db.wallets.orderBy("pubKey").eachPrimaryKey(function (primaryKey) {
    console.debug(`${primaryKey} - ${wallet.gid}`);
    if (String(primaryKey) === wallet.gid) {
      console.debug("walletKey matched!");
      db.wallets
        .update(primaryKey, { isSelected: wallet.isSelected })
        .then(function (updated) {
          if (updated)
            console.debug(
              `wallet.isSelected was changed to: ${wallet.isSelected}`
            );
          else
            console.debug(
              `Nothing was updated - there were no wallet with primary key: ${wallet.gid}`
            );
        });
    }
  });
  return await db.wallets.get(wallet.gid);
};

/**
 * Update a Wallet
 */
export const modifyWallet = async (db: AppDatabase, wallet: Wallet) => {
  if (!wallet.gid)
    throw new Error(
      `${wallet.chain} ${wallet.label} ${wallet.pubKey} gid not found!`
    );

  console.debug(
    `DB gid(${wallet.gid}): changing wallet (${wallet.pubKey}): ${wallet.label} selection -> ${wallet.isSelected}`
  );
  console.debug(
    `DB gid(${wallet.gid}): changing wallet (${wallet.pubKey}): ${
      wallet.label
    } privKey -> ${wallet.privKey?.valueOf()}`
  );
  console.debug(
    `DB gid(${wallet.gid}): changing wallet (${wallet.pubKey}): ${
      wallet.label
    } seed -> ${wallet.seed?.valueOf()}`
  );
  console.debug(
    `DB gid(${wallet.gid}): changing wallet (${wallet.pubKey}): ${wallet.label} seedPhrase -> ${wallet.seedPhrase}`
  );
  return await db.wallets.update(wallet.gid, wallet);
};

/**
 * Delete a Wallet
 */
export const deleteWallet = async (db: AppDatabase, wallet: Wallet) => {
  // console.warn('func: deleteWallet');
  // console.dir(wallet);
  if (!wallet.gid)
    throw new Error(
      `${wallet.chain} ${wallet.label} ${wallet.pubKey} gid not found!`
    );
  console.debug(`removing wallet: ${wallet.label}`);
  // console.debug(`wallet gid: ${wallet.gid}`);
  await db.wallets.delete(wallet.gid);
  return (await db.wallets.get(wallet.gid)) ? false : true;
};

/**
 * Delete a User
 */
export const deleteUser = async (db: AppDatabase, user: User) => {
  if (!user.gid) throw new Error(`${user.email} gid not found!`);
  console.debug(`removing user: ${user.email}`);
  // console.debug(`user gid: ${user.gid}`);
  await db.users.delete(user.gid);
  return (await db.users.get(user.gid)) ? false : true;
};

/**
 * Delete a Profile
 */
export const deleteProfile = async (db: AppDatabase, profile: Profile) => {
  if (!profile.gid) return;
  console.debug(`removing profile: ${profile.email}`);
  console.debug(`profile gid: ${profile.gid}`);
  await db.profiles.delete(profile.gid);
  return (await db.profiles.get(profile.gid)) ? false : true;
};

/**
 * Delete an Item
 */
export const deleteItem = async (db: AppDatabase, item: Item) => {
  if (!item.gid) return;
  console.debug(`removing item: ${item.publicKey}`);
  console.debug(`item gid: ${item.gid}`);
  await db.items.delete(item.gid);
  return (await db.items.get(item.gid)) ? false : true;
};

/**
 * Create a Mint
 *
 * Note that since the mint is guaranteed
 * to have a unique ID we are using `put`
 * to update the databse.
 */
export const createMint = async (db: AppDatabase, mint: Mint) => {
  return await db.mints.put(mint);
};

/**
 * Load Mint records and
 * update the corresponding Wallet id fields.
 */
export const loadWalletMints = async (
  walletGID: string,
  db: AppDatabase
): Promise<Mint[]> => {
  return await getArray(db.mints.where("walletId").equals(walletGID));
};

// Items Database Functions
/**
 * Clear all Item tables
 */
export const clearAllItemTables = async (db: AppDatabase) => {
  await Promise.all([db.items.clear()]);
};

/**
 * Read all Items
 */
export const readAllItems = async (db: AppDatabase): Promise<Item[]> => {
  return await getArray(db.items);
};

/**
 * Create an Item
 *
 * Note that since the user is guaranteed
 * to have a unique ID we are using `put`
 * to update the databse.
 */
export const createItem = async (
  db: AppDatabase,
  item: Item
): Promise<string> => {
  return await db.items.put(item);
};

/**
 * Read an Item
 */
export const readItem = async (db: AppDatabase, itemGID: string) => {
  return await db.items.get(itemGID);
};

/**
 * Update an Item
 */
export const amendItem = async (db: AppDatabase, item: Item) => {
  return await db.items.put(item);
};

/**
 * Load Item records and
 * update the corresponding user id fields.
 */
export const loadUserItems = async (
  userGID: string,
  db: AppDatabase
): Promise<Item[]> => {
  return await getArray(db.items.where("userGID").equals(userGID));
};

export const saveWallet = async (
  wallet: Wallet,
  db: AppDatabase
): Promise<string> => {
  return await db.transaction("rw", db.wallets, async (): Promise<string> => {
    const {
      chain,
      label,
      pubKey,
      encryptedSeedPhrase,
      encryptedPrivKey,
      balance,
      privKey,
      seed,
      seedPhrase,
    } = wallet;
    const isSelected = true;
    const newWallet = new Wallet(
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

export const saveMint = async (
  id: string,
  mintObject: Mint,
  db: AppDatabase
) => {
  await db.transaction("rw", db.wallets, db.mints, async () => {
    const { mint, owner, address } = mintObject;
    await createMint(db, new Mint(id, mint, owner, address));
  });
};

export const getSavedWallets = async (
  db: AppDatabase
): Promise<Wallet[] | void> => {
  return await db.transaction(
    "rw",
    db.wallets,
    async (): Promise<Wallet[] | void> => {
      return await readAllWallets(db);
    }
  );
};

export const getSavedMints = async (
  walletId: string,
  db: AppDatabase
): Promise<Mint[] | void> => {
  return await db.transaction(
    "rw",
    db.wallets,
    db.mints,
    async (): Promise<Mint[] | void> => {
      return await loadWalletMints(walletId, db);
    }
  );
};
