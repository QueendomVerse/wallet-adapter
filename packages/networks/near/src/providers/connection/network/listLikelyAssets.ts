import { config } from './config';

export async function listLikelyTokens(accountId: string) {
    const requestOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    };
    const response = await fetch(`${config.helperUrl}/account/${accountId}/likelyTokens`, requestOptions);
    return response.json();
}

export async function listLikelyNfts(accountId: string) {
    const requestOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    };
    const response = await fetch(`${config.helperUrl}/account/${accountId}/likelyNFTs`, requestOptions);
    return response.json();
}
