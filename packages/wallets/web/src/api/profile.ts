import type { ApiClient, FetchOptions } from './client';
import { emptyProfile } from './empty';
import type { Profile } from './types';

export class ProfileApiClient {
    static EmptyApiProfile: Profile = emptyProfile;

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
    ): Promise<Profile | null> => {
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
        return this.apiClient.handleResponse<Profile>(response, ProfileApiClient.EmptyApiProfile);
    };

    getProfileByAddress = async (address: string): Promise<Profile | null> => {
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
        return this.apiClient.handleResponse<Profile | null>(response, ProfileApiClient.EmptyApiProfile);
    };

    getProfileByEmail = async (email: string): Promise<Profile | null> => {
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
        return this.apiClient.handleResponse<Profile | null>(response, ProfileApiClient.EmptyApiProfile);
    };
}
