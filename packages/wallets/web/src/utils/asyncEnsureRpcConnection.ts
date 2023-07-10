import { sleep } from './helpers';

// This is a hack to prevent an infinite recursion by ensuring there's
// an actual RPC connection before calling any of Connection's methods;
// https://github.com/solana-labs/solana/issues/26198
export interface IRpcConnection {
    _rpcWebSocketConnected?: boolean;
    _rpcWebSocket?: {
        connect: () => void;
    };
}

export const asyncEnsureRpcConnection = async <T>(conn: T, delay = 1000, maxTries = 10): Promise<T> => {
    let count = 0;
    const _conn = conn as IRpcConnection;
    while (count < maxTries && !_conn._rpcWebSocketConnected) {
        console.debug(`connecting(${count}/${maxTries}) ....`);
        await sleep(delay);
        try {
            _conn._rpcWebSocket?.connect();
            _conn._rpcWebSocketConnected = true;
        } catch (error) {
            console.error(`Connection attempt ${count} out of ${maxTries} failed.`);
            if (count === maxTries - 1)
                throw Error(`Failed to establish RPC connection after ${maxTries} attempts: ${error}`);
        }
        count++;
    }
    if (!_conn._rpcWebSocketConnected) throw Error('Unable to establish RPC connection!');
    console.debug('Connection successful.');
    return conn as T;
};
