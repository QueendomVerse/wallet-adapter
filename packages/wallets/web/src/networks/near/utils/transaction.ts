import BN from 'bn.js';
import { sha256 } from 'js-sha256';
import { transactions } from 'near-api-js';
import { createTransaction, SCHEMA, Signature, SignedTransaction } from 'near-api-js/lib/transaction';
import { KeyPair, PublicKey } from 'near-api-js/lib/utils';
import { baseDecode, serialize } from 'borsh';

import { sendJsonRpc } from './helper-api';
import { parseSeedPhrase } from './nearSeedPhrase';

export const keysSort = (o: IAuction) => Object.keys(o).sort().join(',');
export const auctionTransferKeySort = keysSort({ deposit: '1' });
export const auctionStakeKeySort = keysSort({ stake: '1', publickey: '1' });
export const auctionIsTransafer = (auction: IAuction) => keysSort(auction) === auctionTransferKeySort;
export const auctionIsStake = (auction: IAuction) => keysSort(auction) === auctionStakeKeySort;

export interface IAuction {
    methodName?: string;
    args?: object;
    gas?: string;
    deposit?: string;
    // stake
    stake?: string;
    publickey?: string;
}
interface transactionParams {
    contractId: string;
    actions: IAuction[];
    nodeUrl: string;
    accountId: string;
    publicKey: string;
}

export const actionsObjToHash = async ({
    contractId,
    actions: actionsObj,
    nodeUrl,
    accountId,
    publicKey,
}: transactionParams) => {
    const actions = actionsObj.map((auction) => {
        if (!auction.methodName && auction.deposit) {
            return transactions.transfer(new BN(auction.deposit));
        }
        if (!auction.methodName && auction.stake && auction.publickey) {
            return transactions.stake(new BN(auction.stake), PublicKey.from(auction.publickey));
        }
        if (!auction.methodName) {
            throw new Error('Unable to create transaction: methodName is required');
        }
        if (auctionIsTransafer(auction) && auction.deposit) {
            return transactions.transfer(new BN(auction.deposit));
        }
        if (auctionIsStake(auction) && auction.stake && auction.publickey) {
            return transactions.stake(new BN(auction.stake), PublicKey.from(auction.publickey));
        }
        return transactions.functionCall(
            auction.methodName,
            Buffer.from(JSON.stringify(auction.args)),
            new BN(Number(auction.gas ?? 0)),
            new BN(Number(auction.deposit ?? 0))
        );
    });
    const blockRes = await sendJsonRpc(nodeUrl, 'block', {
        finality: 'final',
    });
    const blockHashStr = blockRes.result.header.hash;
    const blockHash = baseDecode(blockHashStr);
    const receiverId = contractId;
    // console.debug('account_id', accountId);
    const accessKeyRes = await sendJsonRpc(nodeUrl, 'query', {
        request_type: 'view_access_key',
        account_id: accountId,
        public_key: publicKey,
        finality: 'optimistic',
    });
    const nonce = ++accessKeyRes.result.nonce;
    const transaction = createTransaction(accountId, PublicKey.from(publicKey), receiverId, nonce, actions, blockHash);
    const message = serialize(SCHEMA, transaction);
    const hash = new Uint8Array(sha256.array(message));
    const signature = await getSign({ message: hash.toString() });
    if (!signature) {
        return { hash: Buffer.from(hash).toString('hex'), error: 'not signature' };
    }

    const signedTx = new SignedTransaction({
        transaction,
        signature: new Signature({
            keyType: transaction.publicKey.keyType,
            data: signature.signature,
        }),
    });
    const bytes = signedTx.encode();
    try {
        const rpcRes = await sendJsonRpc(nodeUrl, 'broadcast_tx_commit', [Buffer.from(bytes).toString('base64')]);
        return {
            hash: Buffer.from(hash).toString('hex'),
            res: rpcRes?.result ?? rpcRes,
        };
    } catch (error) {
        return { hash: Buffer.from(hash).toString('hex'), error };
    }
};

export const getSign = async (json: { message: string }) => {
    const recoverySeedPhrase = localStorage.recoverySeedPhrase;
    if (!recoverySeedPhrase) return console.log('not SeedPhras');
    if (!json.message) return console.log('not message');
    const { secretKey } = await parseSeedPhrase(recoverySeedPhrase);
    if (!secretKey) return console.warn('No secret key found');
    const keyPair = KeyPair.fromString(secretKey);
    const sign = keyPair.sign(Buffer.from(new Uint8Array(json.message.split(',').map((e) => Number(e)))));
    return sign;
};
