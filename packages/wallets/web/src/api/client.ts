import type { BodyInit, Response } from 'node-fetch';
import nodeFetch from 'node-fetch';
import EventEmitter from 'events';
import { URL } from 'url';
import type { FormData } from 'formdata-node';

import { UserApiClient } from './user';
import { WalletApiClient } from './wallet';
import type { ApiProfile } from './types';
import { emptyProfile } from './empty';
import { ItemApiClient } from './item';
import { ProfileApiClient } from './profile';

type CorsMode = 'cors' | 'no-cors' | 'same-origin';

type FetchHeaders = { [header: string]: string };

interface RequestInit {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit;
    formData?: FormData;
}

export interface FetchOptions extends RequestInit {
    headers?: FetchHeaders;
    body?: BodyInit;
    formData?: FormData;
    mode?: CorsMode;
}

interface ApiClientProps {
    apiUrl: string;
    corsMode?: CorsMode;
}

export class ApiClient extends EventEmitter {
    public user: UserApiClient;
    public wallet: WalletApiClient;
    public item: ItemApiClient;
    public profile: ProfileApiClient;

    private apiUrl: string;
    private corsMode: CorsMode;

    constructor({ apiUrl, corsMode = 'no-cors' }: ApiClientProps) {
        super();

        if (!apiUrl) throw new Error('ApiClient: apiUrl is required!');

        this.apiUrl = apiUrl;
        this.corsMode = corsMode;
        this.item = new ItemApiClient(this);
        this.profile = new ProfileApiClient(this);
        this.user = new UserApiClient(this);
        this.wallet = new WalletApiClient(this);
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

    getHealth = async (): Promise<boolean> => {
        const response = await this.fetch('/health');
        return response.ok;
    };

    getRegisteration = async (email: string): Promise<ApiProfile | null> => {
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
