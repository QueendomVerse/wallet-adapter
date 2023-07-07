import * as bs58 from 'bs58';
import * as bip39 from 'bip39';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import SimpleCrypto from 'simple-crypto-js';
// import BN from 'bn.js';

import {
  Chains as lChains
} from 'common/contexts/connection';

import { Wallet as lWallet } from '../../store/types/webWalletTypes';
import { Wallet as DbWallet } from '../../localDB/db';
import { getKeyPairFromSeedPhrase, getKeyPairFromPrivateKey } from './keypairs';
import { thunkUpdateWallet } from '../../store/actions/webWalletActions';

export interface EncryptedData {
  initVector: string;
  content: string;
}

export interface HashedSecret {
  salt: string;
  content: string;
}

export interface DecryptedWallet {
  name: string;
  chain: string;
  privateKey: string;
  publicKey: string;
  seed: Uint8Array;
  seedPhrase: string;
}

export const hashText = async (text: string): Promise<string> => {
  const salt = await bcrypt.genSalt(8);
  const hashed = await bcrypt.hash(text, salt);
  console.debug(`hashed secret ${hashed}`);
  return hashed;
};

export const validateHashedText = async (
  text: string,
  hashedText: string,
): Promise<boolean> => {
  const valid = await bcrypt.compare(text, hashedText);
  console.debug(`hashed text(${text}) -> ${hashedText} valid: ${valid}`);
  return valid;
};

export const generateSecret = (length: number) => {
  const secret = crypto.randomBytes(length / 2).toString('hex');
  console.debug(`random secret: ${secret}`);
  return secret;
};

const isValidChain = (chain: lChains) => {
  if (!chain.name) {
    return false;
  }
  return true;
};

//@TODO modify function to output a publicKey formated base58 string
export const encodeText = (text: string | Uint8Array) => {
  return bs58.encode(Buffer.from(text));
};

export const decodeText = (text: string) => {
  return Buffer.from(bs58.decode(text)).toString();
};

export const encryptText = async (
  text: string,
  secret: string,
): Promise<string> => {
  if (!text) throw new Error(`undefined text input`);
  if (!secret) throw new Error(`undefined secret input`);

  const simpleCrypto = new SimpleCrypto(secret);
  return simpleCrypto.encrypt(text);
};

export const decryptText = (text: string, password: string): string => {
  if (!text) throw new Error(`undefined text input`);
  if (!password) throw new Error(`undefined password input`);

  const simpleCrypto = new SimpleCrypto(password);
  try {
    return simpleCrypto.decrypt(text).toString();
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to decrypt ${text} with password ${password}!`);
  }
};

export const validateKeypairs = async (
  chain: string,
  seedPhrase: string,
  privateKey: string,
) => {
  const keypairFromSeed = getKeyPairFromSeedPhrase(chain, seedPhrase);
  const keypairFromPrivKey = getKeyPairFromPrivateKey(chain, privateKey);
  if (!keypairFromPrivKey || !keypairFromSeed) return;

  if (keypairFromSeed === keypairFromPrivKey) {
    console.debug(`(${chain}): PrivateKey matches seed phrase!`);
    return true;
  }
  return false;
};

export const generateWallet = async (
  label: string,
  chain: string,
  password: string,
) => {
  if (!isValidChain) {
    throw new Error(`Invalid chain: ${chain}`);
  }

  // generate a secret mnemonic phrase
  const generatedMnemonic = bip39.generateMnemonic();
  console.debug(`generatedMnemonic (${chain}/${label}): ${generatedMnemonic}`);

  // encode the secret mnemonic phrase
  const encodeGeneratedMnemonic = bs58.encode(Buffer.from(generatedMnemonic));
  console.debug(
    `encodeGeneratedMnemonic (${chain}/${label}): ${encodeGeneratedMnemonic}`,
  );

  // decode the secret mnemonic phrase
  const decodeGeneratedMnemonic = bs58
    .decode(encodeGeneratedMnemonic)
    .toString();
  const inputMnemonic = decodeGeneratedMnemonic.trim().toLowerCase();
  console.debug(`inputMnemonic (${chain}/${label}): ${inputMnemonic}`);

  // make sure phrase can be decoded
  if (generatedMnemonic != inputMnemonic) {
    throw new Error(
      `generatedMnemonic (${chain}/${label}): ${generatedMnemonic} does not match inputMnemonic: ${inputMnemonic}`,
    );
  }

  // get private key and public key from pharse key
  const keypair = getKeyPairFromSeedPhrase(chain, inputMnemonic);
  if (!keypair) {
    console.error(`failed to generate a ${chain} - ${label} keypair!`);
    return;
  }

  // set the wallet private key
  console.debug(`privKey (${chain}/${label}): ${keypair.privateKey}`);

  // set the wallet public key
  console.debug(`publicKey (${chain}/${label}): ${keypair.publicKey}`);

  // validate seed against generated keys
  if (!validateKeypairs(chain, inputMnemonic, keypair.privateKey ?? ''))
    throw new Error(
      `Error (${chain}/${label}): seed and private key secret keys do not match!`,
    );

  // encrypt the seed phrase
  const encryptedSeedPhrase = await encryptText(inputMnemonic, password);
  console.debug(
    `Hashed seed phrase (${chain}/${label}): ${encryptedSeedPhrase}`,
  );

  // encrypt the private key
  const encryptedPrivateKey = await encryptText(
    keypair.privateKey ?? '',
    password,
  );
  console.debug(
    `Hashed secret key (${chain}/${label}): ${encryptedPrivateKey}`,
  );

  const wallet: lWallet = {
    chain: chain,
    label: label,
    pubKey: keypair.publicKey,
    encryptedSeedPhrase: encryptedSeedPhrase,
    encryptedPrivKey: encryptedPrivateKey,
    balance: 0,
    isSelected: false,
    privKey: undefined,
    seed: undefined,
    seedPhrase: undefined,
  };
  return wallet;
};

export const decryptWallet = async (wallet: lWallet, password: string) => {
  // Get a decrypted wallet
  if (!password) {
    throw new Error("Can't decrypt wallet without specifying a password!");
  }

  // console.debug(`Decrypting wallet: ${wallet.pubKey}`);
  console.debug(
    `Decrypting wallet: '${wallet.pubKey}' using password '${password}'`,
  );

  // Decrypt seed phrase
  let seedPhrase: string = '';
  try {
    seedPhrase = decryptText(wallet.encryptedSeedPhrase, password);
    console.debug(`decrypted seedPhrase: ${seedPhrase}`);
  } catch (error) {
    throw new Error(`Failed to decrypt ${wallet.chain} ${wallet.label} wallet ${wallet.pubKey} seed phrase!`);
  }

  // Get seed
  const seed = bip39.mnemonicToSeedSync(seedPhrase).slice(0, 32);
  // console.debug(`seed: ${seed}`);

  // Decrypt private key and encode
  let privKey: string = '';
  try {
    privKey = decryptText(wallet.encryptedPrivKey, password);
    console.debug(`decrypted privateKey: ${privKey}`);
  } catch (error) {
    throw new Error(`Failed to decrypt ${wallet.chain} ${wallet.label} wallet ${wallet.pubKey} private key!`);
  }

  return {
    ...wallet,
    privKey: Buffer.from(bs58.decode(privKey)),
    seed: seed,
    seedPhrase: seedPhrase,
  } as lWallet;
};

export const decryptDbWallet = async (
  wallet: DbWallet,
  password: string,
): Promise<DbWallet | undefined> => {
  if (!wallet || !password) return;
  console.info(`decrypting(${wallet.chain}/${wallet.label}): ${wallet.pubKey}`);

  // Decrypt seed phrase
  let seedPhrase: string = '';
  try {
    seedPhrase = decryptText(wallet.encryptedSeedPhrase, password);
  } catch (e) {
    throw new Error(`failed to decrypt seed phrase: ${e}`);
  }
  console.debug(`decrypted seedPhrase: ${seedPhrase}`);

  // Get seed
  const seed = bip39.mnemonicToSeedSync(seedPhrase).slice(0, 32);

  // Decrypt private key and encode
  let privateKey: Uint8Array | undefined;
  try {
    const decryptedPrivateKey = decryptText(wallet.encryptedPrivKey, password);
    privateKey = Buffer.from(bs58.decode(decryptedPrivateKey));
  } catch (e) {
    throw new Error(`failed to decrypt the private key: ${e}`);
  }

  const decryptedWallet = new DbWallet(
    wallet.chain,
    wallet.label,
    wallet.pubKey,
    wallet.encryptedSeedPhrase,
    wallet.encryptedPrivKey,
    wallet.balance,
    wallet.isSelected,
    privateKey,
    seed,
    seedPhrase,
  );
  thunkUpdateWallet(decryptedWallet);

  return decryptedWallet;
};

export const closeDbWallet = async (
  wallet: DbWallet,
): Promise<DbWallet | undefined> => {
  if (!wallet) return;
  console.info(`closing(${wallet.chain}/${wallet.label}): ${wallet.pubKey}`);

  const closeWallet = new DbWallet(
    wallet.chain,
    wallet.label,
    wallet.pubKey,
    wallet.encryptedSeedPhrase,
    wallet.encryptedPrivKey,
    wallet.balance,
    false,
    undefined,
    undefined,
    undefined,
  );
  thunkUpdateWallet(closeWallet);

  return closeWallet;
};
