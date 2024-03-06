// import type {
//     RequestInfo as NodeRequestInfo,
//     RequestInit as NodeRequestInit,
//     Response as NodeResponse,
// } from 'node-fetch';
// import nodeFetch from 'node-fetch';
import * as nodeFetch from 'node-fetch';


// https://github.com/solana-labs/solana/issues/24366
// const crossRetry = fetch(cf);
export const fetchWithRetry = async (
    input: nodeFetch.RequestInfo, init?: nodeFetch.RequestInit
    // input: NodeRequestInfo,
    // init?: NodeRequestInit,
    // maxRetries: number = 3,
    // delay: number = 1000
// ): Promise<NodeResponse> => {
): Promise<nodeFetch.Response> => {

    const maxRetries = 3;
    const delay = 1000;
    let retryAttempt = 0;
    while (retryAttempt < maxRetries) {
        try {
            const response = await nodeFetch.default(input, init);
            if (response.status < 400) return response;
        } catch (error) {
            /* ignore error for retry */
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        retryAttempt++;
    }
    throw new Error('Fetch failed after multiple retry attempts.');
};