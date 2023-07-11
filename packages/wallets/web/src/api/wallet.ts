import type { ApiClient } from './client';
import type { LocalTransactionStore } from '../store';
import type { Wallet } from './types';
import { emptyWallet } from './empty';

export class WalletApiClient {
    static EmptyApiWallet: Wallet = emptyWallet;

    constructor(private apiClient: ApiClient = apiClient) {}

    createWallet = async (
        userId: string,
        chain: string,
        label: string,
        pubKey: string,
        encryptedSeedPhrase = '',
        encryptedPrivKey = '',
        balance: number,
        transactions: LocalTransactionStore[] = []
    ): Promise<Wallet[] | null> => {
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

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<Wallet[]>(response, []);
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

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return response.status;
    };

    findAllWallets = async (): Promise<Wallet[] | null> => {
        const endpoint = `/wallets`;

        const response = await this.apiClient.fetch(endpoint);
        const data: { data: Wallet[] } = response.ok ? await response.json() : null;
        return data?.data;
    };

    removeAllWallets = async (): Promise<Wallet[] | undefined> => {
        const endpoint = '/wallets';

        const fetchOptions = {
            method: 'DELETE',
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return response.ok ? (await response.json()).data : undefined;
    };

    findOneWalletById = async (id: string): Promise<Wallet | undefined> => {
        const endpoint = `/wallets/${id}`;

        const response = await this.apiClient.fetch(endpoint);
        return response.ok ? ((await response.json()) as Wallet) : undefined;
    };

    findOneWalletByAddress = async (address: string): Promise<Wallet | undefined> => {
        const endpoint = `/wallets/byAddress/${address}`;

        const response = await this.apiClient.fetch(endpoint);
        return response.ok ? ((await response.json()) as Wallet) : undefined;
    };

    findOneWalletByUserId = async (userId: string): Promise<Wallet | undefined> => {
        const endpoint = `/wallets/byUser/${userId}`;

        const response = await this.apiClient.fetch(endpoint);
        return response.ok ? ((await response.json()) as Wallet) : undefined;
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

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
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

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
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

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return response.status;
    };

    updateTransactions = async (pubKey: string, transactions: LocalTransactionStore[]): Promise<number> => {
        const endpoint = '/wallets/updateTransactions';

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pubKey, transactions }),
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return response.status;
    };
}
