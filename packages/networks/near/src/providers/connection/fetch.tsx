// import createError from 'http-errors';

import { TypedError } from 'near-api-js/lib/providers';
import { logWarning } from 'near-api-js/lib/utils/errors';
import { exponentialBackoff } from '../../utils/exponential-backoff';

const START_WAIT_TIME_MS = 1000;
const BACKOFF_MULTIPLIER = 1.5;
const RETRY_NUMBER = 10;

export interface ConnectionInfo {
    url: string;
    user?: string;
    password?: string;
    allowInsecure?: boolean;
    timeout?: number;
    headers?: { [key: string]: string | number };
}

export const fetchJson = async (connectionInfoOrUrl: string | ConnectionInfo, json?: string): Promise<Response> => {
    let connectionInfo: ConnectionInfo = { url: '' };
    if (typeof connectionInfoOrUrl === 'string') {
        connectionInfo.url = connectionInfoOrUrl;
    } else {
        connectionInfo = connectionInfoOrUrl as ConnectionInfo;
    }

    const response = await exponentialBackoff(START_WAIT_TIME_MS, RETRY_NUMBER, BACKOFF_MULTIPLIER, async () => {
        try {
            const response = await fetch(connectionInfo.url, {
                method: json ? 'POST' : 'GET',
                body: json ? json : undefined,
                headers: { ...connectionInfo.headers, 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                if (response.status === 503) {
                    logWarning(`Retrying HTTP request for ${connectionInfo.url} as it's not available now`);
                    return '';
                }
                // throw createError(response.status, await response.text());
            }
            return response;
        } catch (error) {
            //@ts-ignore
            if (error.toString().includes('FetchError') || error.toString().includes('Failed to fetch')) {
                logWarning(`Retrying HTTP request for ${connectionInfo.url} because of error: ${error}`);
                return null;
            }
            throw error;
        }
    });
    if (!response) {
        throw new TypedError(`Exceeded ${RETRY_NUMBER} attempts for ${connectionInfo.url}.`, 'RetriesExceeded');
    }
    return await response;
};
