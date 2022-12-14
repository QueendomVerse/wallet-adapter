import { ArtType, Artist } from "../../types";
import { Attribute, Creator, FileOrString, MetadataCategory } from "../..";
// import { NativeKeypair } from '../../utils/wallets';

export const FETCH_USERS_SUCCESS = "FETCH_USERS_SUCCESS";
export const CREATE_USER_SUCCESS = "CREATE_USER_SUCCESS";
export const FETCH_USER_SUCCESS = "FETCH_USER_SUCCESS";
export const TOGGLE_SELECT_USER = "TOGGLE_SELECT_USER";
export const UPDATED_USER_SUCCESS = "UPDATED_USER_SUCCESS";

export const FETCH_PROFILES_SUCCESS = "FETCH_PROFILES_SUCCESS";
export const CREATE_PROFILE_SUCCESS = "CREATE_PROFILE_SUCCESS";

export const CREATE_WALLET_SUCCESS = "CREATE_WALLET_SUCCESS";
export const RESTORE_WALLET_SUCCESS = "RESTORE_WALLET_SUCCESS";
export const FETCH_WALLETS_SUCCESS = "FETCH_WALLETS_SUCCESS";
export const REMOVE_WALLET_SUCCESS = "REMOVE_WALLET_SUCCESS";
export const FETCH_WALLET_SUCCESS = "FETCH_WALLET_SUCCESS";
export const UPDATED_WALLET_SUCCESS = "UPDATED_WALLET_SUCCESS";
export const TOGGLE_SELECT_WALLET = "TOGGLE_SELECT_WALLET";

export const CREATE_AIRDROP_SUCCESS = "CREATE_AIRDROP_SUCCESS";
export const CREATE_TRANSACTION_SUCCESS = "CREATE_TRANSACTION_SUCCESS";
export const MINT_NFT_SUCCESS = "MINT_NFT_SUCCESS";
export const FETCH_TRANSACTION_SUCCESS = "FETCH_TRANSACTION_SUCCESS";
export const CREATE_MINT_SUCCESS = "CREATE_MINT_SUCCESS";

export const FETCH_ITEMS_SUCCESS = "FETCH_ITEMS_SUCCESS";
export const CREATE_ITEM_SUCCESS = "CREATE_ITEMS_SUCCESS";

// @TODO: make url, bio, twitter, site, avatarUrl, and walletAddress optional => ?
// @NOTES ensure corresponding changes are propagated to local and backend User schema
export interface User {
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
  wallets?: Wallet[];
}

export interface Profile {
  id: string;
  name: string;
  url: string;
  bio: string;
  twitter: string;
  site: string;
  email: string;
  avatarUrl: string;
  walletAddress: string;
}

export interface KeyPair {
  chain: string;
  publicKey: string;
  privateKey?: string;
  implicitId?: string;
}

// @TODO reorder logically; label, chain, pubKey ....=
export interface Wallet {
  gid?: string;
  chain: string;
  label: string;
  pubKey: string;
  encryptedSeedPhrase: string;
  encryptedPrivKey: string;
  balance: number;
  isSelected?: boolean;
  privKey?: Uint8Array;
  seed?: Uint8Array;
  seedPhrase?: string;
  transactions?: Transaction[];
}

export interface Mint {
  walletId: string;
  mint: string;
  owner: string;
  address: string;
}

export interface Item {
  gid?: string;
  id: string;
  identifier: string;
  uri: string | undefined;
  image: string;
  artists: Artist[] | [];
  mint: string | undefined;
  link: string;
  external_url: string;
  title: string;
  seller_fee_basis_points?: number;
  creators: Creator[] | [];
  type: ArtType;
  category: MetadataCategory;
  edition?: number;
  supply?: number;
  maxSupply?: number;
  solPrice: number;
  description: string;
  story: string;
  attributes?: Attribute[];
  files?: FileOrString[];
  chain: string;
  tokenMint: string;
  publicKey: string;
}

export interface Transaction {
  blockTime: number | null | undefined;
  slot: number;
  amount: number;
  fee: number;
  isToken: boolean;
}

// User Actions
interface createUserAction {
  type: typeof CREATE_USER_SUCCESS;
  payload: User[];
}

interface fetchUsersAction {
  type: typeof FETCH_USERS_SUCCESS;
  payload: User[];
}

interface fetchUserAction {
  type: typeof FETCH_USER_SUCCESS;
  payload: User;
}

interface toggleUserAction {
  type: typeof TOGGLE_SELECT_USER;
  payload: string;
}

interface UpdateUserAction {
  type: typeof UPDATED_USER_SUCCESS;
  payload: User[];
}

interface createProfileAction {
  type: typeof CREATE_PROFILE_SUCCESS;
  payload: Profile[];
}

interface fetchProfilesAction {
  type: typeof FETCH_PROFILES_SUCCESS;
  payload: Profile[];
}

// Wallet Actions
interface createWalletAction {
  type: typeof CREATE_WALLET_SUCCESS;
  payload: Wallet[];
}

interface restoreWalletAction {
  type: typeof RESTORE_WALLET_SUCCESS;
  payload: Wallet[];
}

interface fetchWalletAction {
  type: typeof FETCH_WALLET_SUCCESS;
  payload: Wallet;
}

interface removeWalletAction {
  type: typeof REMOVE_WALLET_SUCCESS;
  payload: Wallet;
}

interface fetchWalletsAction {
  type: typeof FETCH_WALLETS_SUCCESS;
  payload: Wallet[];
}

interface UpdateWalletAction {
  type: typeof UPDATED_WALLET_SUCCESS;
  payload: Wallet[];
}

interface toggleWalletAction {
  type: typeof TOGGLE_SELECT_WALLET;
  payload: string;
}

interface createAirdropAction {
  type: typeof CREATE_AIRDROP_SUCCESS;
  payload: Wallet[];
}

interface createTransactionAction {
  type: typeof CREATE_TRANSACTION_SUCCESS;
  payload: Wallet[];
}

interface createMintNftAction {
  type: typeof MINT_NFT_SUCCESS;
  payload: Wallet[];
}

interface fetchTransactionAction {
  type: typeof FETCH_TRANSACTION_SUCCESS;
  payload: Wallet[];
}

interface createMintAction {
  type: typeof CREATE_MINT_SUCCESS;
  payload: Wallet[];
}

// Item Actions
interface createItemAction {
  type: typeof CREATE_ITEM_SUCCESS;
  payload: Item[];
}

interface fetchItemsAction {
  type: typeof FETCH_ITEMS_SUCCESS;
  payload: Item[];
}

export type WalletActionTypes =
  | fetchWalletsAction
  | createWalletAction
  | restoreWalletAction
  | fetchWalletAction
  | UpdateWalletAction
  | removeWalletAction
  | toggleWalletAction
  | UpdateUserAction
  | createAirdropAction
  | createTransactionAction
  | createMintNftAction
  | fetchTransactionAction
  | createMintAction;

export type UserActionTypes =
  | fetchUsersAction
  | createUserAction
  | UpdateUserAction
  | fetchUserAction
  | toggleUserAction
  | createProfileAction
  | fetchProfilesAction;

export type ItemActionTypes = fetchItemsAction | createItemAction;
