import type { AccountInfo } from '@solana/web3.js';

import type { SolanaConnection, StringPublicKey } from '@mindblox-wallet-adapter/base';
import { SolanaPublicKey } from '@mindblox-wallet-adapter/base';

export const getAccountInfo = async (connection: SolanaConnection, key: StringPublicKey) => {
    const account = await connection.getAccountInfo(new SolanaPublicKey(key));

    if (!account) {
        return null;
    }

    const { data, ...rest } = account;

    return {
        ...rest,
        data,
    } as AccountInfo<Buffer>;
};
