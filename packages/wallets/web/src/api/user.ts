import { FormData } from 'formdata-node';

import type { ApiUser, LocalWalletStore } from '@mindblox-wallet-adapter/base';

import type { ApiClient, FetchOptions } from './client';
import { emptyUser } from './empty';

export class UserApiClient {
    static EmptyApiUser: ApiUser = emptyUser;

    constructor(private apiClient: ApiClient = apiClient) {}

    createUser = async (
        name: string,
        email: string,
        address: string,
        encodedPassword = '',
        hashedPassword = '',
        roles: string[] = [],
        settings: string[] = [],
        wallets: LocalWalletStore[] = []
    ): Promise<ApiUser | null> => {
        const endpoint = '/users';
        const userData = {
            name,
            email,
            walletAddress: address,
            roles,
            settings,
            wallets,
            encryptedPassword: encodedPassword,
            hashedPassword: hashedPassword,
        };

        console.debug(
            `Creating user: ${JSON.stringify({
                ...userData,
                encryptedPassword: '***',
                hashedPassword: '***',
                wallets: ['***'],
            })} ...`
        );

        const found = await this.findOneUserByAddress(address);
        if (found) {
            console.warn(`ApiUser '${address}' already exists!`);
            return UserApiClient.EmptyApiUser;
        }

        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return this.apiClient.handleResponse<ApiUser>(response, UserApiClient.EmptyApiUser);
    };

    removeUser = async (id: string): Promise<boolean | null> => {
        const endpoint = `/users/remove/${id}`;

        console.debug(`Removing user by id: '${id}'...`);

        const fetchOptions: FetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        const isSuccess = this.apiClient.handleResponse<boolean>(response, false);
        return isSuccess;
    };

    findAllUsers = async (): Promise<ApiUser[] | null> => {
        const endpoint = '/users';

        console.debug(`Getting all users...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiUser[] | null>(response, null);
    };

    findOneUserById = async (id: string): Promise<ApiUser | null> => {
        const endpoint = `/users/${id}`;

        console.debug(`Finding user by id: '${id}'...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiUser | null>(response, null);
    };

    findOneUserByAddress = async (address: string): Promise<ApiUser | null> => {
        const endpoint = `/users/byWallet/${address}`;
        console.debug(`Finding user by address: ${address} ...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiUser | null>(response, null);
    };

    findOneUserByEmail = async (email: string): Promise<ApiUser | null> => {
        const endpoint = `/users/byEmail/${email}`;

        console.debug(`Finding user by email: ${email} ...`);

        const fetchOptions: FetchOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse<ApiUser | null>(response, null);
    };

    async uploadUserAvatar(userId: string, avatar: File) {
        const endpoint = `/users/${userId}/avatar`;
        console.debug(`Uploading avatar for user: ${userId} ...`);

        const formData = new FormData();
        formData.append('avatar', avatar);

        const fetchOptions: FetchOptions = {
            method: 'POST',
            formData,
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse(response);
    }

    updateUserAvatar = async (id: string, url: string): Promise<ApiUser | null> => {
        const endpoint = `/users/updateAvatar`;
        const userData = {
            id,
            url,
        };

        console.debug(`Updating user avatar: ${id}`);

        const response = await this.apiClient.fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        return this.apiClient.handleResponse<ApiUser>(response, UserApiClient.EmptyApiUser);
    };

    async uploadUserImage(userId: string, image: File) {
        const endpoint = `/users/${userId}/image`;
        console.debug(`Uploading image for user: ${userId} ...`);

        const formData = new FormData();
        formData.append('image', image);

        const fetchOptions: FetchOptions = {
            method: 'POST',
            formData,
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse(response);
    }

    downloadUserImage = async (id: string): Promise<ImageData | null> => {
        const endpoint = `/users/images/${id}`;
        console.debug(`Downloading user image: ${id}`);

        const response = await this.apiClient.fetch(endpoint, {
            method: 'GET',
            headers: {
                Accept: 'image/png',
                'Content-Type': 'image/png',
            },
        });
        return this.apiClient.handleResponse<ImageData | null>(response, null);
    };

    updateUserImage = async (id: string, url: string): Promise<ApiUser | null> => {
        const endpoint = `/users/updateImage`;
        const userData = {
            id,
            url,
        };

        console.debug(`Updating user image: ${id}`);

        const response = await this.apiClient.fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        return this.apiClient.handleResponse<ApiUser>(response, UserApiClient.EmptyApiUser);
    };

    async uploadBannerImage(userId: string, banner: File) {
        const endpoint = `/users/${userId}/banner`;
        console.debug(`Uploading banner for user: ${userId} ...`);

        const formData = new FormData();
        formData.append('banner', banner);

        const fetchOptions: FetchOptions = {
            method: 'POST',
            formData,
        };

        const response = await this.apiClient.fetch(endpoint, fetchOptions);
        return await this.apiClient.handleResponse(response);
    }

    updateUserBanner = async (id: string, url: string): Promise<ApiUser | null> => {
        const endpoint = `/users/updateBanner`;
        const userData = {
            id,
            url,
        };

        console.debug(`Updating user banner: ${id}`);

        const response = await this.apiClient.fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        return this.apiClient.handleResponse<ApiUser>(response, UserApiClient.EmptyApiUser);
    };

    saveUserSetting = async (id: string, settings: string[]): Promise<ApiUser | null> => {
        const endpoint = `/users/saveSetting`;
        const userData = {
            id,
            settings,
        };

        console.debug(`Saving user setting: ${id}`);

        const response = await this.apiClient.fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        return this.apiClient.handleResponse<ApiUser>(response, UserApiClient.EmptyApiUser);
    };

    saveUserWallets = async (id: string, wallets: LocalWalletStore[]): Promise<ApiUser | null> => {
        const endpoint = `/users/saveWallets`;
        const userData = {
            id,
            wallets,
        };

        console.debug(`Saving user wallets: ${id}`);

        const response = await this.apiClient.fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        return this.apiClient.handleResponse<ApiUser>(response, UserApiClient.EmptyApiUser);
    };

    updateUserRoles = async (id: string, roles: string[]): Promise<ApiUser | null> => {
        const endpoint = `/users/updateRoles`;
        const userData = {
            id,
            roles,
        };

        console.debug(`Updating user roles: ${id}`);

        const response = await this.apiClient.fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        return this.apiClient.handleResponse<ApiUser>(response, UserApiClient.EmptyApiUser);
    };
}
