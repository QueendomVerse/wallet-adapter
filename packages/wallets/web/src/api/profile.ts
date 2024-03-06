import type { ApiProfile, LocalProfileStore } from '@mindblox-wallet-adapter/base';

import type { ApiClientProps, FetchOptions , ApiResponse } from './client';
import { ApiClient } from './client';
import { emptyProfile } from './empty';

export type LocalProfileStoreSubset = Omit<LocalProfileStore, 'id'>

export class ProfileApiClient {
    static EmptyApiProfile: ApiProfile = emptyProfile;

    private apiClient: ApiClient;
    
    constructor(apiClientProps: ApiClientProps) {
        this.apiClient = new ApiClient(apiClientProps)
    }

    createProfile = async (
        profile: LocalProfileStoreSubset
    ): Promise<ApiResponse<ApiProfile | null>> => {
        const endpoint = '/profiles/saveProfile';
        console.debug(`Creating profile: ${JSON.stringify(profile)} ...`);

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profile),
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return this.apiClient.handleResponse<ApiProfile>(response, ProfileApiClient.EmptyApiProfile);
    };

    getProfileByAddress = async (address: string): Promise<ApiResponse<ApiProfile | null>> => {
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

    getProfileByEmail = async (email: string): Promise<ApiResponse<ApiProfile | null>> => {
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
