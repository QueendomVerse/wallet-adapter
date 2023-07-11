import type { LocalItemStore } from '../store';
import type { SolanaAttribute } from '../networks';
import type { ApiClient, FetchOptions } from './client';
import { emptyItem } from './empty';
import type { ApiItem } from './types';

export class ItemApiClient {
    static emptyItem: ApiItem = emptyItem;

    constructor(private apiClient: ApiClient = apiClient) {}

    createItem = async (item: LocalItemStore): Promise<ApiItem | null> => {
        const endpoint = '/items';
        console.debug(`Creating ApiItem: ${JSON.stringify(item)} ...`);

        const fetchOptions: FetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return this.apiClient.handleResponse<ApiItem>(response, ItemApiClient.emptyItem);
    };

    removeItem = async (id: string): Promise<boolean> => {
        const endpoint = `/items/remove/${id}`;
        console.debug(`Removing item by id: '${id}'...`);

        const fetchOptions: FetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id }),
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return response.status === 200;
    };

    findItems = async (): Promise<ApiItem[] | null> => {
        const endpoint = '/items';
        console.debug(`Finding all items...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiItem[]>(response, [ItemApiClient.emptyItem]);
    };

    findOneItem = async (id: string): Promise<ApiItem | null> => {
        const endpoint = `/items/${id}`;
        console.debug(`Finding item by id: '${id}'...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiItem>(response, ItemApiClient.emptyItem);
    };

    findOneItemByIdentifier = async (tokenIdentifier: string): Promise<ApiItem | null> => {
        const endpoint = `/items/byTokenIdentifier/${tokenIdentifier}`;
        console.debug(`Finding item by token identifier: '${tokenIdentifier}'...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiItem>(response, ItemApiClient.emptyItem);
    };

    findOneItemByMint = async (mint: string): Promise<ApiItem | null> => {
        const endpoint = `/items/byMint/${mint}`;
        console.debug(`Finding item by mint: '${mint}'...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiItem>(response, ItemApiClient.emptyItem);
    };

    findOneItemByPublicKey = async (publicKey: string): Promise<ApiItem | null> => {
        const endpoint = `/items/byPublicKey/${publicKey}`;
        console.debug(`Finding item by public key: '${publicKey}'...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiItem>(response, ItemApiClient.emptyItem);
    };

    findOneItemByTokenMint = async (tokenMint: string): Promise<ApiItem | null> => {
        const endpoint = `/items/byTokenMint/${tokenMint}`;
        console.debug(`Finding item by token mint: '${tokenMint}'...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiItem>(response, ItemApiClient.emptyItem);
    };

    updateItemTokenMint = async (mint: string, tokenMint: string): Promise<boolean> => {
        const endpoint = `/items/updateTokenMint`;
        console.debug(`Updating item with mint('${mint}') token mint to '${tokenMint}'`);

        const fetchOptions: FetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tokenMint, mint }),
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return response.status === 200;
    };

    updateItemPrice = async (mint: string, solPrice: string): Promise<boolean> => {
        const endpoint = `/items/updatePrice`;
        console.debug(`Updating item with mint('${mint}') price to '${solPrice}'`);

        const fetchOptions: FetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ solPrice, mint }),
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return response.status === 200;
    };

    updateItemProperties = async (
        id: string,
        title: string,
        description: string,
        story: string,
        attributes: SolanaAttribute[]
    ): Promise<boolean> => {
        const endpoint = `/items/saveProperties`;
        console.debug(`Updating item('${id}') properties`);

        const updatedItem = {
            id,
            title,
            description,
            story,
            attributes,
        };

        const fetchOptions: FetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedItem),
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return response.status === 200;
    };
}
