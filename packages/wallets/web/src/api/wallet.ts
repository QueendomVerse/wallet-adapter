import type { ApiManager } from './manager';
import { ApiResponse, FetchOptions } from './manager';
import type { LocalWallet, LocalTransaction } from '../store';

export interface ApiWallet extends LocalWallet {
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export class WalletApiClient {
    static EmptyApiWallet: ApiWallet = {
        userId: '',
        chain: '',
        label: '',
        pubKey: '',
        encryptedSeedPhrase: '',
        encryptedPrivKey: '',
        balance: 0,
        createdAt: '',
        updatedAt: '',
    };

    constructor(private apiManager: ApiManager = apiManager) {}

    createWallet = async (
        userId: string,
        chain: string,
        label: string,
        pubKey: string,
        encryptedSeedPhrase = '',
        encryptedPrivKey = '',
        balance: number,
        transactions: LocalTransaction[] = []
    ): Promise<ApiWallet[] | null> => {
        const endpoint = '/wallets';
        const newWallet = {
            userId,
            chain,
            label,
            pubKey,
            encryptedSeedPhrase,
            encryptedPrivKey,
            balance,
            transactions,
        };

        console.debug(
            `Creating wallet ${JSON.stringify({
                ...newWallet,
                encryptedSeedPhrase: '***',
                encryptedPrivKey: '***',
            })}...`
        );

        const found = await this.findOneWalletByAddress(pubKey);
        if (found) {
            console.warn(`Wallet '${pubKey}' already exists!`);
            return [WalletApiClient.EmptyApiWallet];
        }

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newWallet),
        };

        const response = await this.apiManager.fetch(endpoint, fetchOptions);
        return await this.apiManager.handleResponse<ApiWallet[]>(response, []);
    };

    removeWallet = async (id: string): Promise<number> => {
        const endpoint = `/wallets/remove/${id}`;

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id }),
        };

        const response = await this.apiManager.fetch(endpoint, fetchOptions);
        return response.status;
    };

    findWallets = async (): Promise<ApiWallet[] | null> => {
        const endpoint = `/wallets`;

        const response = await this.apiManager.fetch(endpoint);
        const data: { data: ApiWallet[] } = response.ok ? await response.json() : null;
        return data?.data;
    };

    removeWallets = async (): Promise<ApiWallet[] | undefined> => {
        const endpoint = '/wallets';

        const fetchOptions = {
            method: 'DELETE',
        };

        const response = await this.apiManager.fetch(endpoint, fetchOptions);
        return response.ok ? (await response.json()).data : undefined;
    };

    findOneWalletById = async (id: string): Promise<ApiWallet | undefined> => {
        const endpoint = `/wallets/${id}`;

        const response = await this.apiManager.fetch(endpoint);
        return response.ok ? ((await response.json()) as ApiWallet) : undefined;
    };

    findOneWalletByAddress = async (address: string): Promise<ApiWallet | undefined> => {
        const endpoint = `/wallets/byAddress/${address}`;

        const response = await this.apiManager.fetch(endpoint);
        return response.ok ? ((await response.json()) as ApiWallet) : undefined;
    };

    findOneWalletByUserId = async (userId: string): Promise<ApiWallet | undefined> => {
        const endpoint = `/wallets/byUser/${userId}`;

        const response = await this.apiManager.fetch(endpoint);
        return response.ok ? ((await response.json()) as ApiWallet) : undefined;
    };

    updateUserId = async (pubKey: string, userId: string): Promise<number> => {
        const endpoint = '/wallets/updateUserId';

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pubKey, userId }),
        };

        const response = await this.apiManager.fetch(endpoint, fetchOptions);
        return response.status;
    };

    updateLabel = async (pubKey: string, label: string): Promise<number> => {
        const endpoint = '/wallets/updateLabel';

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pubKey, label }),
        };

        const response = await this.apiManager.fetch(endpoint, fetchOptions);
        return response.status;
    };

    updateBalance = async (pubKey: string, balance: number): Promise<number> => {
        const endpoint = '/wallets/updateBalance';

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pubKey, balance }),
        };

        const response = await this.apiManager.fetch(endpoint, fetchOptions);
        return response.status;
    };

    updateTransactions = async (pubKey: string, transactions: LocalTransaction[]): Promise<number> => {
        const endpoint = '/wallets/updateTransactions';

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pubKey, transactions }),
        };

        const response = await this.apiManager.fetch(endpoint, fetchOptions);
        return response.status;
    };
}
