import { useCallback } from 'react';

import {
    Wallet, WalletName, SolanaConnection, SolanaTransaction, SolanaTransactionSignature, SolanaPublicKey
} from '@mindblox-wallet-adapter/base';
import { useWallet } from '@mindblox-wallet-adapter/react';

type ButtonState = {
    buttonState: 'connecting' | 'connected' | 'disconnecting' | 'has-wallet' | 'no-wallet';
    onConnect?: () => void;
    onDisconnect?: () => void;
    onSelectWallet?: () => void;
    publicKey?: SolanaPublicKey;
    walletIcon?: string;
    walletName?: WalletName;
};

type Config = {
    onSelectWallet: (config: {
        onSelectWallet: (walletName: WalletName) => void;
        wallets: Wallet<
        SolanaPublicKey, SolanaTransaction, SolanaConnection, SolanaTransactionSignature
        >[];
    }) => void;
};

export function useWalletMultiButton({ onSelectWallet }: Config): ButtonState {
    const { connect, connected, connecting, disconnect, disconnecting, publicKey, select, wallet, wallets } =
        useWallet();
    let buttonState: ButtonState['buttonState'];
    if (connecting) {
        buttonState = 'connecting';
    } else if (connected) {
        buttonState = 'connected';
    } else if (disconnecting) {
        buttonState = 'disconnecting';
    } else if (wallet) {
        buttonState = 'has-wallet';
    } else {
        buttonState = 'no-wallet';
    }
    const handleConnect = useCallback(() => {
        connect().catch(() => {
            // Silently catch because any errors are caught by the context `onError` handler
        });
    }, [connect]);
    const handleDisconnect = useCallback(() => {
        disconnect().catch(() => {
            // Silently catch because any errors are caught by the context `onError` handler
        });
    }, [disconnect]);
    const handleSelectWallet = useCallback(() => {
        onSelectWallet({ onSelectWallet: select, wallets });
    }, [onSelectWallet, select, wallets]);
    return {
        buttonState,
        onConnect: buttonState === 'has-wallet' ? handleConnect : undefined,
        onDisconnect: buttonState !== 'disconnecting' && buttonState !== 'no-wallet' ? handleDisconnect : undefined,
        onSelectWallet: handleSelectWallet,
        publicKey: publicKey ?? undefined,
        walletIcon: wallet?.adapter?.icon,
        walletName: wallet?.adapter?.name,
    };
}
