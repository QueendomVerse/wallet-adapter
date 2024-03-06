"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletListItem = void 0;
const base_1 = require("@mindblox-wallet-adapter/base");
const react_1 = __importDefault(require("react"));
const Button_js_1 = require("./Button.js");
const WalletIcon_js_1 = require("./WalletIcon.js");
const WalletListItem = ({ handleClick, tabIndex, wallet }) => {
    var _a;
    return (react_1.default.createElement("li", null,
        react_1.default.createElement(Button_js_1.Button, { onClick: handleClick, startIcon: react_1.default.createElement(WalletIcon_js_1.WalletIcon, { wallet: wallet }), tabIndex: tabIndex }, (_a = wallet.adapter) === null || _a === void 0 ? void 0 :
            _a.name,
            wallet.readyState === base_1.WalletReadyState.Installed && react_1.default.createElement("span", null, "Detected"))));
};
exports.WalletListItem = WalletListItem;
//# sourceMappingURL=WalletListItem.js.map