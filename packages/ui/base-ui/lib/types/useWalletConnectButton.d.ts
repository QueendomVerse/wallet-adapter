import type { WalletName } from '@mindblox-wallet-adapter/base';
declare type ButtonState = {
    buttonDisabled: boolean;
    buttonState: 'connecting' | 'connected' | 'has-wallet' | 'no-wallet';
    onButtonClick?: () => void;
    walletIcon?: string;
    walletName?: WalletName;
};
export declare function useWalletConnectButton(): ButtonState;
export {};
//# sourceMappingURL=useWalletConnectButton.d.ts.map