import { WalletName } from '@mindblox-wallet-adapter/base';
declare type ButtonState = {
    buttonDisabled: boolean;
    buttonState: 'disconnecting' | 'has-wallet' | 'no-wallet';
    onButtonClick?: () => void;
    walletIcon?: string;
    walletName?: WalletName;
};
export declare function useWalletDisconnectButton(): ButtonState;
export {};
//# sourceMappingURL=useWalletDisconnectButton.d.ts.map