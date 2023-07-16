import type { MintInfo } from '@solana/spl-token';
import type { Cluster } from '@solana/web3.js';
import { Keypair } from '@solana/web3.js';
import BN from 'bn.js';

import type { StringPublicKey } from '@mindblox-wallet-adapter/base';
import { useLocalStorage, formatAmount, SolanaPublicKey } from '@mindblox-wallet-adapter/base';

import type { KnownTokenMap, TokenAccount } from '../types';
import { WAD, ZERO } from '../constants';
import type { AccountDatum } from '../internal';
import { WalletAdapterNetwork } from '../providers';

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

export const accountsEqual = (a?: AccountDatum, b?: AccountDatum): boolean =>
    a && b ? a.accountInfo.data.equals(b.accountInfo.data) : false;

export const getTokenName = (map: KnownTokenMap, mint?: string | SolanaPublicKey, shorten = true): string => {
    const mintAddress = typeof mint === 'string' ? mint : mint?.toBase58();
    if (!mintAddress) {
        return 'N/A';
    }
    const knownSymbol = map.get(mintAddress)?.symbol;
    return knownSymbol ? knownSymbol : shorten ? `${mintAddress.substring(0, 5)}...` : mintAddress;
};

export const getVerboseTokenName = (map: KnownTokenMap, mint?: string | SolanaPublicKey, shorten = true): string => {
    const mintAddress = typeof mint === 'string' ? mint : mint?.toBase58();
    if (!mintAddress) {
        return 'N/A';
    }
    const knownName = map.get(mintAddress)?.name;
    return knownName ? knownName : shorten ? `${mintAddress.substring(0, 5)}...` : mintAddress;
};

export const getTokenByName = (tokenMap: KnownTokenMap, name: string) =>
    Array.from(tokenMap.values()).find((val) => val.symbol === name) || null;

export const getTokenIcon = (map: KnownTokenMap, mintAddress?: string | SolanaPublicKey): string | undefined =>
    !mintAddress ? undefined : map.get(typeof mintAddress !== 'string' ? mintAddress.toBase58() : mintAddress)?.logoURI;

export const isKnownMint = (map: KnownTokenMap, mintAddress: string) => !!map.get(mintAddress);

export const toLamports = (account?: TokenAccount | number, mint?: MintInfo): number => {
    if (!account) {
        return 0;
    }
    const amount = typeof account === 'number' ? account : account.info.amount.toNumber();
    const precision = Math.pow(10, mint?.decimals || 0);
    return Math.floor(amount * precision);
};

export const wadToLamports = (amount?: BN): BN => amount?.div(WAD) || ZERO;

export const fromLamports = (account?: TokenAccount | number | BN, mint?: MintInfo, rate = 1.0): number => {
    if (!account) {
        return 0;
    }
    const amount = Math.floor(
        typeof account === 'number' ? account : BN.isBN(account) ? account.toNumber() : account.info.amount.toNumber()
    );
    const precision = Math.pow(10, mint?.decimals || 9);
    return (amount / precision) * rate;
};

export const tryParseKey = (key: string): SolanaPublicKey | null => {
    try {
        return new SolanaPublicKey(key);
    } catch {
        return null;
    }
};

export const formatTokenAmount = (
    account?: TokenAccount | number | BN,
    mint?: MintInfo,
    rate = 1.0,
    prefix = '',
    suffix = '',
    precision = 2,
    abbr = false
): string => (account ? `${[prefix]}${formatAmount(fromLamports(account, mint, rate), precision, abbr)}${suffix}` : '');

export const convert = (account?: TokenAccount | number, mint?: MintInfo, rate = 1.0): number => {
    if (!account) {
        return 0;
    }
    const amount = typeof account === 'number' ? account : account.info.amount.toNumber();
    const precision = Math.pow(10, mint?.decimals || 0);
    return (amount / precision) * rate;
};

export const validateSolAddress = (address: string): boolean => {
    try {
        const pubkey = new SolanaPublicKey(address);
        return pubkey.toBuffer().length === 32;
    } catch (error) {
        console.error(`Invalid address: ${error}`);
        return false;
    }
};

export const publicKeyToAddress = (publicKey: SolanaPublicKey): StringPublicKey => publicKey.toBase58();

export const addressToPublicKey = (address: StringPublicKey): SolanaPublicKey => new SolanaPublicKey(address);

export const getPublicKeyFromPrivateKey = (privateKey: string): SolanaPublicKey => {
    const walletKeyPair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKey)));
    return walletKeyPair.publicKey;
};

export const getAdapterCluster = (cluster?: string): Cluster => {
    if (!cluster) return WalletAdapterNetwork.Devnet;
    switch (cluster) {
        case 'devnet':
            return WalletAdapterNetwork.Devnet;
        case 'testnet':
            return WalletAdapterNetwork.Testnet;
        case 'mainnet-beta':
            return WalletAdapterNetwork.Mainnet;
        default:
            return WalletAdapterNetwork.Devnet;
    }
};

export const getAdapterNetwork = (network?: string): WalletAdapterNetwork => {
    if (!network) return WalletAdapterNetwork.Devnet;
    switch (network) {
        case 'devnet':
            return WalletAdapterNetwork.Devnet;
        case 'testnet':
            return WalletAdapterNetwork.Testnet;
        case 'mainnet-beta':
            return WalletAdapterNetwork.Mainnet;
        case 'localnet':
            return WalletAdapterNetwork.Localnet;
        default:
            return WalletAdapterNetwork.Devnet;
    }
};
