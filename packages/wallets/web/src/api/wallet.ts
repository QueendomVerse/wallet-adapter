import type { ApiWallet, Chain, LocalTransactionStore, LocalWalletStore } from '@mindblox-wallet-adapter/base';

import type { ApiClientProps, ApiResponse, FetchOptions } from './client';
import { ApiClient } from './client';
import { emptyWallet } from './empty';

export interface LocalWalletStoreSubset extends Omit<
    LocalWalletStore,
        | 'gid'
        | 'seed'
> {
  userId: string;
}

export class WalletApiClient {
    static EmptyApiWallet: ApiWallet = emptyWallet;

    private apiClient: ApiClient;
    
    constructor(apiClientProps: ApiClientProps) {
        this.apiClient = new ApiClient(apiClientProps)
    }

    createWallet = async (
        wallet: LocalWalletStoreSubset
    ): Promise<ApiResponse<ApiWallet | null>> => {
        const endpoint = '/wallets';
        console.debug(
            `Creating wallet ${JSON.stringify({
                ...wallet,
                encryptedSeedPhrase: '***',
                encryptedPrivKey: '***',
            })}...`
        );

        const found = await this.findOneWalletByAddress(wallet.pubKey);
        if (found) {
            console.warn(`ApiWallet '${wallet.pubKey}' already exists!`);
            return {data: WalletApiClient.EmptyApiWallet};
        }

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(wallet),
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiWallet>(response, WalletApiClient.EmptyApiWallet);
    };

    removeWallet = async (id: string): Promise<ApiResponse<boolean | null>> => {
        const endpoint = `/wallets/remove/${id}`;
        console.debug(`Removing wallet by id: '${id}'...`);

        const fetchOptions: FetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id }),
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        const isSuccess = this.apiClient.handleResponse<boolean>(response, false);
        return isSuccess;
    };

    findAllWallets = async (): Promise<ApiResponse<ApiWallet[] | null>> => {
        const endpoint = `/wallets`;
        console.debug(`Getting all wallets...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiWallet[] | null>(response, null);
    };

    removeAllWallets = async (): Promise<ApiResponse<ApiWallet[] | null>> => {
        const endpoint = '/wallets';
        console.debug(`Removing all wallets...`);

        const fetchOptions: FetchOptions = {
            method: 'DELETE',
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiWallet[] | null>(response, null);
    };

    findOneWalletById = async (id: string): Promise<ApiResponse<ApiWallet | null>> => {
        const endpoint = `/wallets/${id}`;
        console.debug(`Finding wallet by id: '${id}'...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiWallet | null>(response, null);
    };

    findOneWalletByAddress = async (address: string): Promise<ApiResponse<ApiWallet | null>> => {
        const endpoint = `/wallets/byAddress/${address}`;
        console.debug(`Finding wallet by address: ${address} ...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiWallet | null>(response, null);
    };

    findOneWalletByUserId = async (userId: string): Promise<ApiResponse<ApiWallet | null>> => {
        const endpoint = `/wallets/byUser/${userId}`;
        console.debug(`Finding wallet by user id: ${userId} ...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiWallet | null>(response, null);
    };

    updateUserId = async (pubKey: string, userId: string): Promise<ApiResponse<ApiWallet | null>> => {
        const endpoint = '/wallets/updateUserId';
        console.debug(`Updating user[${userId}] wallet: ${pubKey}`);

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pubKey, userId }),
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiWallet | null>(response, null);
    };

    updateLabel = async (pubKey: string, label: string): Promise<ApiResponse<ApiWallet | null>> => {
        const endpoint = '/wallets/updateLabel';
        console.debug(`Updating wallet[${pubKey}] label: ${label}`);

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pubKey, label }),
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiWallet | null>(response, null);
    };

    updateBalance = async (pubKey: string, balance: number): Promise<ApiResponse<ApiWallet | null>> => {
        const endpoint = '/wallets/updateBalance';
        console.debug(`Updating wallet[${pubKey}] balance: ${balance}`);

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pubKey, balance }),
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiWallet | null>(response, null);
    };

    updateTransactions = async (pubKey: string, transactions: LocalTransactionStore[]): Promise<ApiResponse<ApiWallet | null>> => {
        const endpoint = '/wallets/updateTransactions';
        console.debug(`Updating wallet[${pubKey}] transactions: ${JSON.stringify(transactions)}`);

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pubKey, transactions }),
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiWallet | null>(response, null);
    };
}
