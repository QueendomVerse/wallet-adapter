import { decode as decodeBs58 } from 'bs58';

export const capitalizeFirst = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export const isHex = (text: string): boolean => /^[A-Fa-f0-9]+$/.test(text);

export const isBase58 = (address: string): boolean => {
    try {
        Buffer.from(decodeBs58(address));
        return true;
    } catch (e) {
        return false;
    }
};
