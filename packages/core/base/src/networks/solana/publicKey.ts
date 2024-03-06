import { PublicKey } from "@solana/web3.js";

import { useLocalStorage } from '../../utils';

export class SolanaPublicKey extends PublicKey {}


export const findProgramAddress = (seeds: (Buffer | Uint8Array)[], programId: SolanaPublicKey) => {
    if (!seeds || seeds.length < 1 || !programId) return;
    const localStorage = useLocalStorage();
    const key = 'pda-' + seeds.reduce((agg, item) => agg + item?.toString('hex'), '') + programId.toString();
    const cached = localStorage.getItem(key);
    if (cached) {
        const value = JSON.parse(cached);
        return [value.key, parseInt(value.nonce)] as [string, number];
    }
    let result: [SolanaPublicKey, number] = [new SolanaPublicKey('So11111111111111111111111111111111111111112'), 0];
    try {
        result = SolanaPublicKey.findProgramAddressSync(seeds, programId);
    } catch (e) {
        console.error(e);
        return;
    }
    try {
        localStorage.setItem(key, JSON.stringify({ key: result[0].toBase58(), nonce: result[1] }));
    } catch {
        /* ignore */
    }
    return [result[0].toBase58(), result[1]] as [string, number];
};