"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWalletDisconnectButton = void 0;
const react_1 = require("react");
const react_2 = require("@mindblox-wallet-adapter/react");
function useWalletDisconnectButton() {
    var _a, _b;
    const { disconnecting, disconnect, wallet } = (0, react_2.useWallet)();
    let buttonState;
    if (disconnecting) {
        buttonState = 'disconnecting';
    }
    else if (wallet) {
        buttonState = 'has-wallet';
    }
    else {
        buttonState = 'no-wallet';
    }
    const handleDisconnectButtonClick = (0, react_1.useCallback)(() => {
        disconnect().catch(() => {
            // Silently catch because any errors are caught by the context `onError` handler
        });
    }, [disconnect]);
    return {
        buttonDisabled: buttonState !== 'has-wallet',
        buttonState,
        onButtonClick: buttonState === 'has-wallet' ? handleDisconnectButtonClick : undefined,
        walletIcon: (_a = wallet === null || wallet === void 0 ? void 0 : wallet.adapter) === null || _a === void 0 ? void 0 : _a.icon,
        walletName: (_b = wallet === null || wallet === void 0 ? void 0 : wallet.adapter) === null || _b === void 0 ? void 0 : _b.name,
    };
}
exports.useWalletDisconnectButton = useWalletDisconnectButton;
//# sourceMappingURL=useWalletDisconnectButton.js.map