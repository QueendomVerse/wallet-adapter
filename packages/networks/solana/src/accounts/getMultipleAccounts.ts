import type { AccountInfo } from '@solana/web3.js';

import { chunks } from '@mindblox-wallet-adapter/base';

export const getMultipleAccounts = async (connection: any, keys: string[], commitment = 'single') => {
    console.debug(`getMultipleAccounts, keys: ${keys}`);
    console.table(keys);
    const result = await Promise.all(
        chunks(keys, 99).map((chunk) => getMultipleAccountsCore(connection, chunk, commitment))
    );

    const array = result
        .map(
            (a) =>
                a?.array.map((acc) => {
                    if (!acc) {
                        return undefined;
                    }

                    const { data, ...rest } = acc;
                    const obj = {
                        ...rest,
                        data: Buffer.from(data[0], 'base64'),
                    } as AccountInfo<Buffer>;
                    return obj;
                }) as AccountInfo<Buffer>[]
        )
        .flat();
    return { keys, array };
};

const getMultipleAccountsCore = async (connection: any, keys: string[], commitment: string) => {
    const args = connection._buildArgs([keys], commitment, 'base64');
    console.debug(`args: ${args}`);
    if (!args) {
        return;
    }

    const unsafeRes = await connection._rpcRequest('getMultipleAccounts', args);
    if (!unsafeRes) {
        return;
    }
    console.debug(`unsafeRes: ${unsafeRes}`);
    if (unsafeRes.error) {
        throw new Error('failed to get info about account ' + unsafeRes.error.message);
    }

    if (unsafeRes.result.value) {
        const array = unsafeRes.result.value as AccountInfo<string[]>[];
        return { keys, array };
    }

    // TODO: fix
    throw new Error();
};
