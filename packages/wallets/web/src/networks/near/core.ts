import { decode as decodeBs58 } from 'bs58';
import * as nearAPI from 'near-api-js';
import type BN from 'bn.js';

import { type NftMetaData } from './types';

import { ChainNetworks } from '../../chains';
import {
    useAccount,
    // useConnect,,
    generateNearKeys,
    // NftProps,
    // MetadataProps
} from '../../networks/near';
import { type LocalKeyPairStore } from '../../store';

// import { connect, Contract, InMemorySigner, KeyPair } from 'near-api-js';
// import {
//   PublicKey,
// } from 'near-api-js/lib/utils';
// import {
//   formatNearAmount,
//   parseNearAmount,
// } from 'near-api-js/lib/utils/format';
// import { Balance } from 'contexts/wallet/near/components';

export interface NearKeypair {
    keypair: nearAPI.utils.KeyPair;
}

export const getAccount = async (privateKey: string) => {
    // const wallet = useAccount(privateKey, 'testnet');
    try {
        return useAccount(privateKey, 'testnet');
        // return wallet;
    } catch (err) {
        console.error(`Failed getting balance(): ${err}`);
    }
};

export const getImplicitAccountId = (publicKey: string) => {
    const id = Buffer.from(decodeBs58(publicKey)).toString('hex');
    console.debug(`Implicit Account ID(${publicKey}): ${id}`);
    return id;
};

export const getNativeKeyPairFromPrivateKey = (privateKey: string): NearKeypair => {
    return {
        keypair: nearAPI.utils.KeyPair.fromString(privateKey),
    };
};

export const getKeyPairFromSeedPhrase = async (seedPhrase: string) => {
    return await generateNearKeys(seedPhrase);
};

export const getKeyPairFromPrivateKey = (privateKey: string): LocalKeyPairStore | undefined => {
    const { keypair } = getNativeKeyPairFromPrivateKey(privateKey);
    if (!keypair) return;

    const publicKey = keypair.getPublicKey();
    // Parse string for the base58 key
    const pubKeyBase58 = publicKey.toString().substring(8, publicKey.toString().length);
    const accountID = getImplicitAccountId(pubKeyBase58);
    return {
        chain: ChainNetworks.NEAR,
        privateKey: privateKey,
        publicKey: pubKeyBase58,
        implicitId: accountID,
    } as LocalKeyPairStore;
};

export const getPublicKey = (publicKey: string) => {
    console.debug(`Near: getPublicKey: ${publicKey}`);
    const pubKey = nearAPI.utils.PublicKey.fromString(publicKey).toString();
    // Parse string for the base58 key
    const pubKeyBase58 = pubKey.toString().substring(8, pubKey.toString().length);
    console.debug(`Near: pubKeyBase58: ${pubKeyBase58}`);
    const accountID = getImplicitAccountId(pubKeyBase58);
    return {
        chain: ChainNetworks.NEAR,
        publicKey: pubKeyBase58,
        implicitId: accountID,
    } as LocalKeyPairStore;
};

export const getBalance = async (privateKey: string) => {
    const { balance } = useAccount(privateKey, 'testnet');
    try {
        const bal = await balance();
        return Number(parseFloat(bal.balance));
    } catch (err) {
        console.error(`Failed getting Near balance(): ${err}`);
    }
};

export const sendFundsTransaction = async (privateKey: string, toAddress: string, amount: string) => {
    const { send } = useAccount(privateKey, 'testnet');
    return send(toAddress, amount);
};

export interface MintNft {
    privateKey: string;
    metadata: NftMetaData;
    // assetTitle: string,
    // assetDescription: string,
    // assetUrl: string,
    receiverId: string;
    attachedDeposit?: BN;
    perpetualRoyalties?: [string, number][] | undefined;
}
export const mintNft = async ({
    // privateKey, assetTitle, assetDescription, assetUrl, receiverId, attachedDeposit
    privateKey,
    metadata,
    receiverId,
    attachedDeposit,
    perpetualRoyalties,
}: MintNft): Promise<nearAPI.providers.FinalExecutionOutcome | undefined> => {
    console.debug('func: mintNft');
    console.info(privateKey);
    console.info(receiverId, attachedDeposit);
    const { getMinimumStorage, sendStorageDeposit, mintAssetToNft } = useAccount(privateKey, 'testnet');
    const minStor = await getMinimumStorage();
    console.debug('mintNft minStor: ', minStor);
    await sendStorageDeposit();
    return mintAssetToNft({
        metadata,
        receiverId,
        perpetualRoyalties,
        attachedDeposit: minStor,
    });
};
