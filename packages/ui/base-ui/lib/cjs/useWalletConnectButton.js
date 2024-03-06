"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWalletConnectButton = void 0;
const react_1 = require("react");
const react_2 = require("@mindblox-wallet-adapter/react");
function useWalletConnectButton() {
    var _a, _b;
    const { connect, connected, connecting, wallet } = (0, react_2.useWallet)();
    let buttonState;
    if (connecting) {
        buttonState = 'connecting';
    }
    else if (connected) {
        buttonState = 'connected';
    }
    else if (wallet) {
        buttonState = 'has-wallet';
    }
    else {
        buttonState = 'no-wallet';
    }
    const handleConnectButtonClick = (0, react_1.useCallback)(() => {
        connect().catch(() => {
            // Silently catch because any errors are caught by the context `onError` handler
        });
    }, [connect]);
    return {
        buttonDisabled: buttonState !== 'has-wallet',
        buttonState,
        onButtonClick: buttonState === 'has-wallet' ? handleConnectButtonClick : undefined,
        walletIcon: (_a = wallet === null || wallet === void 0 ? void 0 : wallet.adapter) === null || _a === void 0 ? void 0 : _a.icon,
        walletName: (_b = wallet === null || wallet === void 0 ? void 0 : wallet.adapter) === null || _b === void 0 ? void 0 : _b.name,
    };
}
exports.useWalletConnectButton = useWalletConnectButton;
//# sourceMappingURL=useWalletConnectButton.js.map