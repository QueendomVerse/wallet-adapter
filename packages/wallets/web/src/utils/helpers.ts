// import crossFetch, {Response as CrossResponse} from 'cross-fetch';
// import fetchRetry from 'fetch-retry';
import { Connection } from '@solana/web3.js';
import type {
    RequestInfo as NodeRequestInfo,
    RequestInit as NodeRequestInit,
    Response as NodeResponse,
} from 'node-fetch';
import nodeFetch from 'node-fetch';

// Attempt at preventing infinite recursions
// https://github.com/solana-labs/solana/issues/24366
// const crossRetry = fetch(cf);
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
