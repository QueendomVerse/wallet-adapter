import type { Connection as NearConnection } from 'near-api-js/lib/connection';
import NonFungibleTokens from './network/NonFungibleTokens';
import { listLikelyNfts } from './network/listLikelyAssets';

export const getNonFungibleTokenList = async (connection: NearConnection, accountId: string) => {
    console.warn('func: getNonFungibleTokenList');
    console.info('getNonFungibleTokenList: connection');
    console.dir(connection);
    const nonFungibleTokensService = new NonFungibleTokens(connection);
    console.info('getNonFungibleTokenList: nonFungibleTokensService');
    console.dir(nonFungibleTokensService);

    const likelyNFTs = await listLikelyNfts(accountId);
    console.info('likelyNFTs');
    console.dir(likelyNFTs);
    // const nonFungibleTokensMetadata = {};
    const nonFungibleTokens = await Promise.all(
        await likelyNFTs.map(async (contractName: string) => {
            const fetchedMetadata = await nonFungibleTokensService.getMetadata({ contractName });
            console.info('fetchedMetadata');
            console.dir(fetchedMetadata);
            // if (!this.nftMetadata[contractName]) {
            //     const fetchedMetadata = await this.nonFungibleTokensService.getMetadata({ contractName });
            //     nonFungibleTokensMetadata[contractName] = fetchedMetadata;
            // }
            // else {
            //     nonFungibleTokensMetadata[contractName] = nftMetadata[contractName];
            // }
            const tokens = await nonFungibleTokensService.getTokens({
                contractName: contractName,
                accountId: accountId,
                base_uri: fetchedMetadata.base_uri,
            });
            console.info('tokens');
            console.dir(tokens);
            return tokens;

            // const tokenBalance = await nonFungibleTokensService.getBalanceOf({ contractName, accountId: multisafeId });

            // return { ...nonFungibleTokensMetadata[contractName], tokenBalance, contractName, tokens };
        })
    );
    console.info('nonFungibleTokens: nonFungibleTokens');
    console.dir(nonFungibleTokens);
    return nonFungibleTokens;
};
