import { entropyToMnemonic, generateMnemonic, mnemonicToSeed } from 'bip39';
import { derivePath } from 'near-hd-key';
import { encode as encodeBs58 } from 'bs58';
import { sign as signNacl } from 'tweetnacl';

const KEY_DERIVATION_PATH = "m/44'/397'/0'";

export interface KeyInfo {
    seedPhrase?: string;
    secretKey?: string;
    publicKey?: string;
}

const generateSeedPhrase = async (entropy?: string): Promise<KeyInfo> => {
    return parseSeedPhrase(entropy !== undefined ? entropyToMnemonic(entropy) : generateMnemonic());
};

const normalizeSeedPhrase = (seedPhrase: string): string =>
    seedPhrase
        .trim()
        .split(/\s+/)
        .map((part) => part.toLowerCase())
        .join(' ');

const parseSeedPhrase = async (seedPhrase: string, derivationPath?: string): Promise<KeyInfo> => {
    const seed = await mnemonicToSeed(normalizeSeedPhrase(seedPhrase));
    const { key } = derivePath(derivationPath || KEY_DERIVATION_PATH, seed.toString('hex'));
    const keyPair = signNacl.keyPair.fromSeed(key);
    const publicKey: string = 'ed25519:' + encodeBs58(Buffer.from(keyPair.publicKey));
    const secretKey: string = 'ed25519:' + encodeBs58(Buffer.from(keyPair.secretKey));
    return { seedPhrase, secretKey, publicKey };
};

const findSeedPhraseKey = async (seedPhrase: string, publicKeys: string[]): Promise<KeyInfo> => {
    const { publicKey } = await parseSeedPhrase(seedPhrase);
    return publicKey && publicKeys.includes(publicKey) ? { publicKey } : {};
};

export { KEY_DERIVATION_PATH, generateSeedPhrase, normalizeSeedPhrase, parseSeedPhrase, findSeedPhraseKey };
