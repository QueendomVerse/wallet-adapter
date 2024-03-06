import * as bs58 from 'bs58';
import { KeyPair } from 'near-api-js/lib/utils';

export const getImplicitAccountIdFromPrivateKey = (privateKey: string) => {
  // Generate Near Keypair
  const keyPair = KeyPair.fromString(privateKey);
  // Get Public key
  const publicKey = keyPair.getPublicKey();
  // Parse string for the base58 key
  const base58 = publicKey.toString().substring(8, publicKey.toString().length);
  // Get the implicit account id
  const account = Buffer.from(bs58.decode(base58)).toString('hex');
  console.debug(`Implicit Account ID(${base58}): ${account}`);
  return account;
};
