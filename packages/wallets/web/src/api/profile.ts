import type { ApiProfile } from '@mindblox-wallet-adapter/base';
import type { ApiClient, FetchOptions } from './client';
import { emptyProfile } from './empty';

export class ProfileApiClient {
    static EmptyApiProfile: ApiProfile = emptyProfile;

    constructor(private apiClient: ApiClient = apiClient) {}

    createProfile = async (
        name?: string,
        url?: string,
        bio?: string,
        twitter?: string,
        site?: string,
        email?: string,
        avatarUrl?: string,
        address?: string
    ): Promise<ApiProfile | null> => {
        const endpoint = '/profiles/saveProfile';
        const profileData = {
            name,
            url,
            bio,
            twitter,
            site,
            email,
            avatarUrl,
            walletAddress: address,
        };

        console.debug(`Creating profile: ${JSON.stringify(profileData)} ...`);

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData),
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return this.apiClient.handleResponse<ApiProfile>(response, ProfileApiClient.EmptyApiProfile);
    };

    getProfileByAddress = async (address: string): Promise<ApiProfile | null> => {
        const endpoint = `/profiles/byAddress/${address}`;
        console.debug(`Getting profile by address: ${address} ...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return this.apiClient.handleResponse<ApiProfile | null>(response, ProfileApiClient.EmptyApiProfile);
    };

    getProfileByEmail = async (email: string): Promise<ApiProfile | null> => {
        const endpoint = `/profiles/byEmail/${email}`;
        console.debug(`Getting profile by email: ${email} ...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return this.apiClient.handleResponse<ApiProfile | null>(response, ProfileApiClient.EmptyApiProfile);
    };
}
