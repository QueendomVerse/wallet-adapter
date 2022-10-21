import * as bs58 from "bs58";
import * as nearAPI from "near-api-js";
import BN from "bn.js";

import { ChainNetworks } from "../../../contexts/connection/chains";
import {
  useAccount,
  // useConnect,,
  generateNearKeys,
  NftMetaData,
  // NftProps,
  // MetadataProps
} from "../../../contexts/connection/networks/near";
import { KeyPair as lKeypair } from "../../../store/types/webWalletTypes";
import { WalletPrivateKeyError } from "../..";

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
    return useAccount(privateKey, "testnet");
    // return wallet;
  } catch (err) {
    console.error(`Failed getting balance(): ${err}`);
  }
};

export const getImplicitAccountId = (publicKey: string) => {
  const id = Buffer.from(bs58.decode(publicKey)).toString("hex");
  console.debug(`Implicit Account ID(${publicKey}): ${id}`);
  return id;
};

export const getNativeKeyPairFromPrivateKey = (
  privateKey: string
): NearKeypair => {
  return {
    keypair: nearAPI.utils.KeyPair.fromString(privateKey),
  };
};

export const getKeyPairFromSeedPhrase = (seedPhrase: string) => {
  return generateNearKeys(seedPhrase);
};

export const getKeyPairFromPrivateKey = (
  privateKey: string
): lKeypair | undefined => {
  const { keypair } = getNativeKeyPairFromPrivateKey(privateKey);
  if (!keypair) return;

  const publicKey = keypair.getPublicKey();
  // Parse string for the base58 key
  const pubKeyBase58 = publicKey
    .toString()
    .substring(8, publicKey.toString().length);
  const accountID = getImplicitAccountId(pubKeyBase58);
  return {
    chain: ChainNetworks.NEAR,
    privateKey: privateKey,
    publicKey: pubKeyBase58,
    implicitId: accountID,
  } as lKeypair;
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
  } as lKeypair;
};

export const getBalance = async (privateKey: string) => {
  if (!privateKey) {
    throw new WalletPrivateKeyError(
      "Get get balance without providing a private key!"
    );
  }
  const { balance } = useAccount(privateKey, "testnet");
  try {
    const bal = await balance();
    return Number(parseFloat(bal.balance));
  } catch (err) {
    console.error(`Failed getting Near balance(): ${err}`);
  }
};

export const sendTransaction = async (
  privateKey: string,
  toAddress: string,
  amount: string
) => {
  const { send } = useAccount(privateKey, "testnet");
  return send(toAddress, amount);
};

export interface MintNftProps {
  privateKey: string;
  tokenId: string;
  metadata: NftMetaData;
  // perpetualRoyalties?: Map<string, number>
  perpetualRoyalties?: { [accountId: string]: number };
  receiverId: string;
  attachedDeposit: BN;
}
export const mintNft = async ({
  privateKey,
  tokenId,
  metadata,
  perpetualRoyalties,
  receiverId,
  attachedDeposit,
}: MintNftProps): Promise<
  nearAPI.providers.FinalExecutionOutcome | undefined
> => {
  console.warn("func: mintNft");
  console.info(privateKey);
  console.dir(metadata);
  console.info(receiverId, attachedDeposit);
  const { getMinimumStorage, sendStorageDeposit, mintAssetToNft } = useAccount(
    privateKey,
    "testnet"
  );
  const minStor = await getMinimumStorage();
  console.error("mintNft minStor: ", minStor);
  await sendStorageDeposit();
  // return mintAssetToNft({
  //   assetTitle, assetDescription, assetUrl, receiverId, attachedDeposit: minStor
  // });
  return mintAssetToNft({
    tokenId,
    metadata,
    receiverId,
    perpetualRoyalties,
    attachedDeposit: minStor,
  });
};
