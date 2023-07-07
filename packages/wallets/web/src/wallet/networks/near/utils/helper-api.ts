// import { connect, Contract, InMemorySigner, KeyPair } from 'near-api-js';
import { type PublicKey } from 'near-api-js/lib/utils';
import { removeEd25519 } from './keyStore';

export const getAccountIds = async ({
  publicKey,
  ACCOUNT_HELPER_URL,
}: {
  publicKey: PublicKey;
  ACCOUNT_HELPER_URL: string;
}) => {
  const controller = new AbortController();
  const pubKey = removeEd25519(publicKey.toString());
  const fetchUrl = new URL(
    `${ACCOUNT_HELPER_URL}/publicKey/${pubKey}/accounts`,
  );
  return await fetch(fetchUrl.href, {
    signal: controller.signal,
  }).then(res => res.json());
};

let _nextId = 123;
export async function sendJsonRpc(
  ACCOUNT_NODE_URL: string,
  method: string,
  params: object,
) {
  return await fetch(`${ACCOUNT_NODE_URL}/`, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      method: method,
      params: params,
      id: _nextId++,
      jsonrpc: '2.0',
    }),
    method: 'POST',
  }).then(res => res.json());
}

export async function getFiat({
  ACCOUNT_HELPER_URL,
}: {
  ACCOUNT_HELPER_URL: string;
}) {
  const controller = new AbortController();
  return (await fetch(`${ACCOUNT_HELPER_URL}/fiat`, {
    signal: controller.signal,
  }).then(res => res.json())) as {
    near: {
      cny: number;
      eur: number;
      last_updated_at: number;
      usd: number;
    };
  };
}

export interface TransactionsResponseItem {
  action_index: number;
  action_kind: string;
  args: {
    deposit?: string;
    access_key?: {
      nonce: number;
      permission: {
        permission_kind: string; //FULL_ACCESS
      };
    };
    public_key?: string;
  };
  block_hash: string;
  block_timestamp: string;
  hash: string;
  receiver_id: string;
  signer_id: string;
}

export async function getTransactions({
  accountId,
  ACCOUNT_HELPER_URL,
}: {
  accountId: string;
  ACCOUNT_HELPER_URL: string;
}) {
  if (!accountId) return {};

  const txs: TransactionsResponseItem[] = await fetch(
    `${ACCOUNT_HELPER_URL}/account/${accountId}/activity`,
  ).then(res => res.json());

  return txs.map((t, i) => ({
    ...t,
    // kind: t.action_kind
    //   .split('_')
    //   .map((s) => s.substr(0, 1) + s.substr(1).toLowerCase())
    //   .join(''),
    kind: t.action_kind,
    block_timestamp: parseInt(t.block_timestamp.substr(0, 13), 10),
    hash_with_index: t.action_index + ':' + t.hash,
    checkStatus: !(i && t.hash === txs[i - 1].hash),
  }));
}

export interface PublicKeyData {
  access_key: {
    nonce: string;
    permission: string;
  };
  public_key?: string;
}

export interface PublicKeyResponseItem {
  id: string;
  jsonrpc: string;
  result: {
    block_hash: string;
    block_height: string;
    keys?: PublicKeyData[];
  };
}

export async function fetchPublicKeys(rpcNodeUrl: string, accountId: string) {
  const url = new URL(rpcNodeUrl);
  const response = await fetch(url.toString(), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      method: 'query',
      params: {
        request_type: 'view_access_key_list',
        finality: 'final',
        account_id: accountId,
      },
      id: 'dontcare',
      jsonrpc: '2.0',
    }),
    method: 'POST',
  });

  const data = response.ok
    ? ((await response.json()) as PublicKeyResponseItem)
    : undefined;
  return data ? (data.result.keys as PublicKeyData[]) : undefined;
}
