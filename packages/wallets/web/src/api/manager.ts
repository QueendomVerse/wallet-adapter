import type { BodyInit, Response } from 'node-fetch';
import nodeFetch from 'node-fetch';
import EventEmitter from 'events';
import { URL } from 'url';

import type { FormData } from 'formdata-node';

import { UserApiClient } from './user';
import { WalletApiClient } from './wallet';

type CorsMode = 'cors' | 'no-cors' | 'same-origin';

type FetchHeaders = { [header: string]: string };

export interface FetchOptions extends RequestInit {
    headers?: FetchHeaders;
    body?: BodyInit;
    formData?: FormData;
    mode?: CorsMode;
}

interface RequestInit {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit;
    formData?: FormData;
}

interface ApiManagerProps {
    apiUrl: string;
    corsMode?: CorsMode;
}

export type ApiResponse = {
    data: string;
    path: string;
};

export class ApiManager extends EventEmitter {
    public userApiClient: UserApiClient;
    public walletApiClient: WalletApiClient;

    private apiUrl: string;
    private corsMode: CorsMode;

    constructor({ apiUrl, corsMode = 'no-cors' }: ApiManagerProps) {
        super();
        this.apiUrl = apiUrl;
        this.corsMode = corsMode;
        this.userApiClient = new UserApiClient(this);
        this.walletApiClient = new WalletApiClient(this);
    }

    fetch = async (endpoint: string, options: FetchOptions = { method: 'GET' }): Promise<Response> => {
        try {
            const fetchInit: FetchOptions = {
                ...options,
                mode: this.corsMode,
            };

            return await nodeFetch(new URL(endpoint, this.apiUrl).toString(), fetchInit);
        } catch (error) {
            const errorMsg = `Fetching failed: ${error instanceof Error ? error.message : error}`;
            this.emit('error', errorMsg);
            throw new Error(errorMsg);
        }
    };

    handleResponse = async <T>(response: Response, nullValue?: T): Promise<T | null> => {
        return !response.ok
            ? nullValue !== undefined
                ? nullValue
                : (() => {
                      const error = new Error(`Fetch error: ${response.status}`);
                      this.emit('error', `Fetch error: ${response.status}`);
                      console.error(error);
                      throw error;
                  })()
            : (async () => {
                  try {
                      const data = await response.json();
                      return data as T;
                  } catch (e) {
                      console.error(`Error parsing response to JSON`, e);
                      throw e;
                  }
              })();
    };

    public async getHealth(): Promise<boolean> {
        const response = await this.fetch('/health');
        return response.ok;
    }
}
