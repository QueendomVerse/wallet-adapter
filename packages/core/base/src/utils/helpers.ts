import { decode as decodeBase58 } from 'bs58';
import type {
    RequestInfo as NodeRequestInfo,
    RequestInit as NodeRequestInit,
    Response as NodeResponse,
} from 'node-fetch';
import nodeFetch from 'node-fetch';

export const fetchWithRetry = async (
    input: NodeRequestInfo,
    init: NodeRequestInit | undefined,
    maxRetries = 3,
    delay = 1000
): Promise<NodeResponse> => {
    let retryAttempt = 0;
    while (retryAttempt < maxRetries) {
        try {
            const response = await nodeFetch(input, init);
            if (response.status < 400) return response;
        } catch (error) {
            /* ignore error for retry */
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        retryAttempt++;
    }
    throw new Error('Fetch failed after multiple retry attempts.');
};

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const chunks = <T>(array: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(array.length / size) }, (_, index) => array.slice(index * size, (index + 1) * size));

export const getUnixTs = () => {
    return new Date().getTime() / 1000;
};

export const capitalizeFirst = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export const isHex = (text: string): boolean => /^[A-Fa-f0-9]+$/.test(text);

export const isBase58 = (address: string): boolean => {
    try {
        Buffer.from(decodeBase58(address));
        return true;
    } catch (e) {
        return false;
    }
};
