import type { Wallet as StandardWallet, WalletWithFeatures as StandardWalletWithFeatures } from '@wallet-standard/base';
import type {
    StandardConnectFeature,
    StandardDisconnectFeature,
    StandardEventsFeature,
} from '@wallet-standard/features';
import {
    StandardConnect,
    StandardEvents,
} from '@wallet-standard/features';
import type {
    SolanaSignAndSendTransactionFeature,
    SolanaSignMessageFeature,
    SolanaSignTransactionFeature,
} from '@solana/wallet-standard-features';
import {
    SolanaSignAndSendTransaction,
    SolanaSignTransaction,
} from '@solana/wallet-standard-features';

import type { WalletAdapter, WalletAdapterProps } from './adapter';
import { ChainConnection, ChainPublicKey, ChainTransaction, ChainTransactionSignature } from './types';

export type WalletAdapterCompatibleStandardWallet = StandardWalletWithFeatures<
    StandardConnectFeature &
        StandardEventsFeature &
        (SolanaSignAndSendTransactionFeature | SolanaSignTransactionFeature) &
        (StandardDisconnectFeature | SolanaSignMessageFeature | object)
>;

export interface StandardWalletAdapterProps<
    PublicKey extends ChainPublicKey,
    Transaction extends ChainTransaction,
    Connection extends ChainConnection,
    TransactionSignature extends ChainTransactionSignature,
    Name extends string = string
> extends WalletAdapterProps<
    PublicKey, Transaction, Connection, TransactionSignature, Name
> {
    wallet: WalletAdapterCompatibleStandardWallet;
    standard: true;
}

export type StandardWalletAdapter<
    PublicKey extends ChainPublicKey,
    Transaction extends ChainTransaction,
    Connection extends ChainConnection,
    TransactionSignature extends ChainTransactionSignature,
    Name extends string = string
> = WalletAdapter<
    PublicKey, Transaction, Connection, TransactionSignature, Name
> &
    StandardWalletAdapterProps<PublicKey, Transaction, Connection, TransactionSignature, Name>;

export const isWalletAdapterCompatibleStandardWallet = (
    wallet: StandardWallet
): wallet is WalletAdapterCompatibleStandardWallet => {
    return (
        StandardConnect in wallet.features &&
        StandardEvents in wallet.features &&
        (SolanaSignAndSendTransaction in wallet.features || SolanaSignTransaction in wallet.features)
    );
}