import { Wallet, WalletName, SolanaConnection, SolanaTransaction, SolanaTransactionSignature, SolanaPublicKey } from '@mindblox-wallet-adapter/base';
declare type ButtonState = {
    buttonState: 'connecting' | 'connected' | 'disconnecting' | 'has-wallet' | 'no-wallet';
    onConnect?: () => void;
    onDisconnect?: () => void;
    onSelectWallet?: () => void;
    publicKey?: SolanaPublicKey;
    walletIcon?: string;
    walletName?: WalletName;
};
declare type Config = {
    onSelectWallet: (config: {
        onSelectWallet: (walletName: WalletName) => void;
        wallets: Wallet<SolanaPublicKey, SolanaTransaction, SolanaConnection, SolanaTransactionSignature>[];
    }) => void;
};
export declare function useWalletMultiButton({ onSelectWallet }: Config): ButtonState;
export {};
//# sourceMappingURL=useWalletMultiButton.d.ts.map