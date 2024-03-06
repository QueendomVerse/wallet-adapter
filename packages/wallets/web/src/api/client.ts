import type { BodyInit, RequestInit, Response} from 'node-fetch';
import nodeFetch from 'node-fetch';
import EventEmitter from 'events';
import type { FormData } from 'formdata-node';

import type { ApiProfile } from '@mindblox-wallet-adapter/base';

import { emptyProfile } from './empty';

type CorsMode = 'cors' | 'no-cors' | 'same-origin';

type FetchHeaders = { [header: string]: string };

// interface RequestInit {
//     method?: string;
//     headers?: HeadersInit;
//     body?: BodyInit;
//     formData?: FormData;
// }

export interface ApiResponse<T> {
    data: T;
  }

export interface FetchOptions extends RequestInit {
    headers?: FetchHeaders;
    body?: BodyInit;
    formData?: FormData;
    mode?: CorsMode;
}

export interface ApiClientProps {
    apiUrl: string;
    corsMode?: CorsMode;
}

export class ApiClient extends EventEmitter {
    private apiUrl: string;
    private corsMode: CorsMode;

    constructor({ apiUrl, corsMode = 'no-cors' }: ApiClientProps) {
        super();

        if (!apiUrl) throw new Error('ApiClient: apiUrl is required!');

        this.apiUrl = apiUrl;
        this.corsMode = corsMode;

        (async () => {
            const health = await this.getHealth()
            this.emit('status', `API connection health: ${health}`)
        })
    }

    fetch = async (endpoint: string, options: FetchOptions = { method: 'GET' }): Promise<Response> => {
        try {
            const fetchInit: FetchOptions = {
                ...options,
                mode: this.corsMode,
            };
            const apiUrl = new URL(this.apiUrl);
            const basePath = apiUrl.pathname.endsWith('/') ? apiUrl.pathname.slice(0, -1) : apiUrl.pathname;
            const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
            const fullUrl = new URL(basePath + endpointPath, apiUrl.origin);
            console.debug(`Fetching url ${fullUrl} with options: ${JSON.stringify(fetchInit)}`);

            const result = await nodeFetch(fullUrl, fetchInit);
            if (!result.ok) {
                throw new Error(`Unable to fetch on endpoint ${fullUrl}: No response from the API`)
            }
            return result;
        } catch (error) {
            const errorMsg = `Fetching failed: ${error instanceof Error ? error.message : error}`;
            this.emit('error', errorMsg);
            throw new Error(errorMsg);
        }
    };

    handleResponse = async <T>(response: Response, nullValue?: T): Promise<ApiResponse<T | null>> => {
        console.debug('Handling API response ...')
        return !response.ok
            ? nullValue !== undefined
                ? { data: nullValue }
                : (() => {
                      const error = new Error(`Fetch error: ${response.status}`);
                      this.emit('error', `Fetch error: ${response.status}`);
                      console.error(error);
                      throw error;
                  })()
            : (async () => {
                  try {
                      const result = await response.json();
                      return { data: result as T };
                  } catch (e) {
                      console.error(`Error parsing response to JSON`, e);
                      throw e;
                  }
              })();
    };

    getHealth = async (): Promise<ApiResponse<string>> => {
        console.debug('Getting health ...')
        const response = await this.fetch('/health');
        const status = await response.text();
        console.debug(`API health status: ${status}`)
        return { data: status };
    };

    getRegisteration = async (email: string): Promise<ApiResponse<ApiProfile | null>> => {
        const endpoint = `/registeration/${email}`;
        const emailData = { email };

        console.debug(`Getting registeration for email: ${email}`);

        const response = await this.fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData),
        });

        return this.handleResponse<ApiProfile>(response, emptyProfile);
    };
}
