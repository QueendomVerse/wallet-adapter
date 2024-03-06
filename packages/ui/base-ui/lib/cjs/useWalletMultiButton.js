"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWalletMultiButton = void 0;
const react_1 = require("react");
const react_2 = require("@mindblox-wallet-adapter/react");
function useWalletMultiButton({ onSelectWallet }) {
    var _a, _b;
    const { connect, connected, connecting, disconnect, disconnecting, publicKey, select, wallet, wallets } = (0, react_2.useWallet)();
    let buttonState;
    if (connecting) {
        buttonState = 'connecting';
    }
    else if (connected) {
        buttonState = 'connected';
    }
    else if (disconnecting) {
        buttonState = 'disconnecting';
    }
    else if (wallet) {
        buttonState = 'has-wallet';
    }
    else {
        buttonState = 'no-wallet';
    }
    const handleConnect = (0, react_1.useCallback)(() => {
        connect().catch(() => {
            // Silently catch because any errors are caught by the context `onError` handler
        });
    }, [connect]);
    const handleDisconnect = (0, react_1.useCallback)(() => {
        disconnect().catch(() => {
            // Silently catch because any errors are caught by the context `onError` handler
        });
    }, [disconnect]);
    const handleSelectWallet = (0, react_1.useCallback)(() => {
        onSelectWallet({ onSelectWallet: select, wallets });
    }, [onSelectWallet, select, wallets]);
    return {
        buttonState,
        onConnect: buttonState === 'has-wallet' ? handleConnect : undefined,
        onDisconnect: buttonState !== 'disconnecting' && buttonState !== 'no-wallet' ? handleDisconnect : undefined,
        onSelectWallet: handleSelectWallet,
        publicKey: publicKey !== null && publicKey !== void 0 ? publicKey : undefined,
        walletIcon: (_a = wallet === null || wallet === void 0 ? void 0 : wallet.adapter) === null || _a === void 0 ? void 0 : _a.icon,
        walletName: (_b = wallet === null || wallet === void 0 ? void 0 : wallet.adapter) === null || _b === void 0 ? void 0 : _b.name,
    };
}
exports.useWalletMultiButton = useWalletMultiButton;
//# sourceMappingURL=useWalletMultiButton.js.map