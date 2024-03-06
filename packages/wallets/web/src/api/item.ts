import type { ApiItem, LocalItemStore, SolanaAttribute } from '@mindblox-wallet-adapter/base';

import type { ApiClientProps, FetchOptions , ApiResponse } from './client';
import { ApiClient } from './client';
import { emptyItem } from './empty';

export class ItemApiClient {
    static emptyItem: ApiItem = emptyItem;

    private apiClient: ApiClient;
    
    constructor(apiClientProps: ApiClientProps) {
        this.apiClient = new ApiClient(apiClientProps)
    }

    createItem = async (item: LocalItemStore): Promise<ApiResponse<ApiItem | null>> => {
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

    removeItem = async (id: string): Promise<ApiResponse<boolean | null>> => {
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
        const isSuccess = this.apiClient.handleResponse<boolean>(response, false);
        return isSuccess;
    };

    findItems = async (): Promise<ApiResponse<ApiItem[] | null>> => {
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

    findOneItem = async (id: string): Promise<ApiResponse<ApiItem | null>> => {
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

    findOneItemByIdentifier = async (tokenIdentifier: string): Promise<ApiResponse<ApiItem | null>> => {
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

    findOneItemByMint = async (mint: string): Promise<ApiResponse<ApiItem | null>> => {
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

    findOneItemByPublicKey = async (publicKey: string): Promise<ApiResponse<ApiItem | null>> => {
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

    findOneItemByTokenMint = async (tokenMint: string): Promise<ApiResponse<ApiItem | null>> => {
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

    updateItemTokenMint = async (mint: string, tokenMint: string): Promise<ApiResponse<ApiItem | null>> => {
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
        return await this.apiClient.handleResponse<ApiItem>(response, ItemApiClient.emptyItem);
    };

    updateItemPrice = async (mint: string, solPrice: string): Promise<ApiResponse<ApiItem | null>> => {
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
        return await this.apiClient.handleResponse<ApiItem>(response, ItemApiClient.emptyItem);
    };

    updateItemProperties = async (
        id: string,
        title: string,
        description: string,
        story: string,
        attributes: SolanaAttribute[]
    ): Promise<ApiResponse<ApiItem | null>> => {
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
        return await this.apiClient.handleResponse<ApiItem>(response, ItemApiClient.emptyItem);
    };
}
