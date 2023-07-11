import Dexie from 'dexie';
import { createId } from '@paralleldrive/cuid2';
import type { LocalTransactionStore } from '../store';
import { INDEXED_DB_VERSION } from './constants';
// import { LocalWalletStore } from '../store';

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
        public chain: string,
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

export class IndexDbAppDatabase extends Dexie {
    public users!: Dexie.Table<IndexDbUser, string>;
    public profiles!: Dexie.Table<IndexDbProfile, string>;
    public wallets!: Dexie.Table<IndexDbWallet, string>;
    public mints!: Dexie.Table<IndexDbMint, string>;

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
        } catch (error) {
            console.error(`IndexDB error: ${error}`);
        }
    }
}

export const db = new IndexDbAppDatabase();
