import { encode as encodeBase58, decode as decodeBase58 } from 'bs58';
import { compare, genSalt, hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import SimpleCrypto from 'simple-crypto-js';

export const hashText = async (text: string): Promise<string> => {
    const salt = await genSalt(8);
    const hashed = await hash(text, salt);
    console.debug(`hashed secret ${hashed}`);
    return hashed;
};

export const validateHashedText = async (text: string, hashedText: string): Promise<boolean> => {
    const valid = await compare(text, hashedText);
    console.debug(`hashed text(${text}) -> ${hashedText} valid: ${valid}`);
    return valid;
};

export const generateSecret = (length: number) => {
    const secret = randomBytes(length / 2).toString('hex');
    console.debug(`random secret: ${secret}`);
    return secret;
};

export const encodeText = (text: string | Uint8Array) => {
    return encodeBase58(Buffer.from(text));
};

export const decodeText = (text: string) => {
    return Buffer.from(decodeBase58(text)).toString();
};

export const encryptText = async (text: string, secret: string): Promise<string> => {
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
