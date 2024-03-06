import { encode as encodeBase58, decode as decodeBase58 } from 'bs58';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { compare, genSalt, hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import SimpleCrypto from 'simple-crypto-js';
// import BN from 'bn.js';

import type { LocalWalletStore, Chain } from '@mindblox-wallet-adapter/base';
import { encryptText, decryptText, isChain } from '@mindblox-wallet-adapter/base';
import { getKeyPairFromSeedPhrase, getKeyPairFromPrivateKey } from '@mindblox-wallet-adapter/networks';

import type { IndexDbAppDatabase} from '../indexDb';
import { IndexDbWallet } from '../indexDb';
import type { NotificationParams} from '../store';
import { thunkUpdateWallet } from '../store';

export const validateKeypairs = async (chain: Chain, seedPhrase: string, privateKey: string) => {
    const keypairFromSeed = await getKeyPairFromSeedPhrase(chain, seedPhrase);
    const keypairFromPrivKey = getKeyPairFromPrivateKey(chain, privateKey);
    if (!keypairFromPrivKey || !keypairFromSeed) return;

    if (keypairFromSeed === keypairFromPrivKey) {
        console.debug(`(${chain}): PrivateKey matches seed phrase!`);
        return true;
    }
    return false;
};

export const generateWallet = async (label: string, chain: Chain, password: string) => {
    if (!isChain(chain)) {
        throw new Error(`Invalid chain: ${chain}`);
    }

    // generate a secret mnemonic phrase
    const generatedMnemonic = generateMnemonic();
    console.debug(`generatedMnemonic (${chain}/${label}): ${generatedMnemonic}`);

    // encode the secret mnemonic phrase
    const encodeGeneratedMnemonic = encodeBase58(Buffer.from(generatedMnemonic));
    console.debug(`encodeGeneratedMnemonic (${chain}/${label}): ${encodeGeneratedMnemonic}`);

    // decode the secret mnemonic phrase
    const decodeGeneratedMnemonic = decodeBase58(encodeGeneratedMnemonic).toString();
    const inputMnemonic = decodeGeneratedMnemonic.trim().toLowerCase();
    console.debug(`inputMnemonic (${chain}/${label}): ${inputMnemonic}`);

    // make sure phrase can be decoded
    if (generatedMnemonic != inputMnemonic) {
        throw new Error(
            `generatedMnemonic (${chain}/${label}): ${generatedMnemonic} does not match inputMnemonic: ${inputMnemonic}`
        );
    }

    // get private key and public key from pharse key
    const keypair = await getKeyPairFromSeedPhrase(chain, inputMnemonic);
    if (!keypair?.privateKey || !keypair?.publicKey) {
        console.warn(`failed to generate a ${chain} - ${label} keypair!`);
        return;
    }

    // set the wallet private key
    console.debug(`privKey (${chain}/${label}): ${keypair.privateKey}`);

    // set the wallet public key
    console.debug(`publicKey (${chain}/${label}): ${keypair.publicKey}`);

    // validate seed against generated keys
    if (!validateKeypairs(chain, inputMnemonic, keypair.privateKey ?? ''))
        throw new Error(`Error (${chain}/${label}): seed and private key secret keys do not match!`);

    // encrypt the seed phrase
    const encryptedSeedPhrase = await encryptText(inputMnemonic, password);
    console.debug(`Hashed seed phrase (${chain}/${label}): ${encryptedSeedPhrase}`);

    // encrypt the private key
    const encryptedPrivateKey = await encryptText(keypair.privateKey ?? '', password);
    console.debug(`Hashed secret key (${chain}/${label}): ${encryptedPrivateKey}`);

    const wallet: LocalWalletStore = {
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

export const decryptWallet = async (wallet: LocalWalletStore, password: string) => {
    // Get a decrypted wallet
    if (!password) {
        throw new Error("Can't decrypt wallet without specifying a password!");
    }

    // console.debug(`Decrypting wallet: ${wallet.pubKey}`);
    console.debug(`Decrypting wallet: '${wallet.pubKey}' using password '${password}'`);

    // Decrypt seed phrase
    let seedPhrase = '';
    try {
        seedPhrase = decryptText(wallet.encryptedSeedPhrase, password);
        console.debug(`decrypted seedPhrase: ${seedPhrase}`);
    } catch (error) {
        throw new Error(`Failed to decrypt ${wallet.chain} ${wallet.label} wallet ${wallet.pubKey} seed phrase!`);
    }

    // Get seed
    const seed = mnemonicToSeedSync(seedPhrase).slice(0, 32);
    // console.debug(`seed: ${seed}`);

    // Decrypt private key and encode
    let privKey = '';
    try {
        privKey = decryptText(wallet.encryptedPrivKey, password);
        console.debug(`decrypted privateKey: ${privKey}`);
    } catch (error) {
        throw new Error(`Failed to decrypt ${wallet.chain} ${wallet.label} wallet ${wallet.pubKey} private key!`);
    }

    return {
        ...wallet,
        privKey: Buffer.from(decodeBase58(privKey)),
        seed: seed,
        seedPhrase: seedPhrase,
    } as LocalWalletStore;
};

export const decryptDbWallet = async ({wallet, password, indexDb, notification} : {
    wallet: IndexDbWallet,
    password: string,
    indexDb: IndexDbAppDatabase,
    notification?: (params: NotificationParams) => void
}): Promise<IndexDbWallet | undefined> => {
    if (!wallet || !password) return;
    console.info(`decrypting(${wallet.chain}/${wallet.label}): ${wallet.pubKey}`);

    // Decrypt seed phrase
    let seedPhrase = '';
    try {
        seedPhrase = decryptText(wallet.encryptedSeedPhrase, password);
    } catch (e) {
        throw new Error(`failed to decrypt seed phrase: ${e}`);
    }
    console.debug(`decrypted seedPhrase: ${seedPhrase}`);

    // Get seed
    const seed = mnemonicToSeedSync(seedPhrase).slice(0, 32);

    // Decrypt private key and encode
    let privateKey: Uint8Array | undefined;
    try {
        const decryptedPrivateKey = decryptText(wallet.encryptedPrivKey, password);
        privateKey = Buffer.from(decodeBase58(decryptedPrivateKey));
    } catch (e) {
        throw new Error(`failed to decrypt the private key: ${e}`);
    }

    const decryptedWallet = new IndexDbWallet(
        wallet.chain,
        wallet.label,
        wallet.pubKey,
        wallet.encryptedSeedPhrase,
        wallet.encryptedPrivKey,
        wallet.balance,
        wallet.isSelected,
        privateKey,
        seed,
        seedPhrase
    );
    thunkUpdateWallet({wallet: decryptedWallet, indexDb, notification});

    return decryptedWallet;
};

export const closeDbWallet = async ({wallet, indexDb, notification} : {
    wallet: IndexDbWallet,
    indexDb: IndexDbAppDatabase,
    notification?: (params: NotificationParams) => void
}): Promise<IndexDbWallet | undefined> => {
    if (!wallet) return;
    console.info(`closing(${wallet.chain}/${wallet.label}): ${wallet.pubKey}`);

    const closeWallet = new IndexDbWallet(
        wallet.chain,
        wallet.label,
        wallet.pubKey,
        wallet.encryptedSeedPhrase,
        wallet.encryptedPrivKey,
        wallet.balance,
        false,
        undefined,
        undefined,
        undefined
    );
    thunkUpdateWallet({wallet: closeWallet, indexDb, notification});

    return closeWallet;
};
