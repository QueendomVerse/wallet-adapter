import { WalletReadyState } from '@mindblox-wallet-adapter/base';
import { useWallet } from '@mindblox-wallet-adapter/react';
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Collapse } from './Collapse.js';
import { useWalletModal } from './useWalletModal.js';
import { WalletListItem } from './WalletListItem.js';
import { WalletSVG } from './WalletSVG.js';
export const WalletModal = ({ className = '', container = 'body' }) => {
    const ref = useRef(null);
    const { wallets, select } = useWallet();
    const { setVisible } = useWalletModal();
    const [expanded, setExpanded] = useState(false);
    const [fadeIn, setFadeIn] = useState(false);
    const [portal, setPortal] = useState(null);
    const [listedWallets, collapsedWallets] = useMemo(() => {
        const installed = [];
        const loadable = [];
        const notDetected = [];
        for (const wallet of wallets) {
            if (wallet.readyState === WalletReadyState.NotDetected) {
                notDetected.push(wallet);
            }
            else if (wallet.readyState === WalletReadyState.Loadable) {
                loadable.push(wallet);
            }
            else if (wallet.readyState === WalletReadyState.Installed) {
                installed.push(wallet);
            }
        }
        let listed = [];
        let collapsed = [];
        if (installed.length) {
            listed = installed;
            collapsed = [...loadable, ...notDetected];
        }
        else if (loadable.length) {
            listed = loadable;
            collapsed = notDetected;
        }
        else {
            collapsed = notDetected;
        }
        return [listed, collapsed];
    }, [wallets]);
    const hideModal = useCallback(() => {
        setFadeIn(false);
        setTimeout(() => setVisible(false), 150);
    }, [setVisible]);
    const handleClose = useCallback((event) => {
        event.preventDefault();
        hideModal();
    }, [hideModal]);
    const handleWalletClick = useCallback((event, walletName) => {
        select(walletName ?? 'WebWallet');
        handleClose(event);
    }, [select, handleClose]);
    const handleCollapseClick = useCallback(() => setExpanded(!expanded), [expanded]);
    const handleTabKey = useCallback((event) => {
        const node = ref.current;
        if (!node)
            return;
        // here we query all focusable elements
        const focusableElements = node.querySelectorAll('button');
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const firstElement = focusableElements[0];
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const lastElement = focusableElements[focusableElements.length - 1];
        if (event.shiftKey) {
            // if going backward by pressing tab and firstElement is active, shift focus to last focusable element
            if (document.activeElement === firstElement) {
                lastElement.focus();
                event.preventDefault();
            }
        }
        else {
            // if going forward by pressing tab and lastElement is active, shift focus to first focusable element
            if (document.activeElement === lastElement) {
                firstElement.focus();
                event.preventDefault();
            }
        }
    }, [ref]);
    useLayoutEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                hideModal();
            }
            else if (event.key === 'Tab') {
                handleTabKey(event);
            }
        };
        // Get original overflow
        const { overflow } = window.getComputedStyle(document.body);
        // Hack to enable fade in animation after mount
        setTimeout(() => setFadeIn(true), 0);
        // Prevent scrolling on mount
        document.body.style.overflow = 'hidden';
        // Listen for keydown events
        window.addEventListener('keydown', handleKeyDown, false);
        return () => {
            // Re-enable scrolling when component unmounts
            document.body.style.overflow = overflow;
            window.removeEventListener('keydown', handleKeyDown, false);
        };
    }, [hideModal, handleTabKey]);
    useLayoutEffect(() => setPortal(document.querySelector(container)), [container]);
    return (portal &&
        createPortal(React.createElement("div", { "aria-labelledby": "wallet-adapter-modal-title", "aria-modal": "true", className: `wallet-adapter-modal ${fadeIn && 'wallet-adapter-modal-fade-in'} ${className}`, ref: ref, role: "dialog" },
            React.createElement("div", { className: "wallet-adapter-modal-container" },
                React.createElement("div", { className: "wallet-adapter-modal-wrapper" },
                    React.createElement("button", { onClick: handleClose, className: "wallet-adapter-modal-button-close" },
                        React.createElement("svg", { width: "14", height: "14" },
                            React.createElement("path", { d: "M14 12.461 8.3 6.772l5.234-5.233L12.006 0 6.772 5.234 1.54 0 0 1.539l5.234 5.233L0 12.006l1.539 1.528L6.772 8.3l5.69 5.7L14 12.461z" }))),
                    listedWallets.length ? (React.createElement(React.Fragment, null,
                        React.createElement("h1", { className: "wallet-adapter-modal-title" }, "Connect a wallet on Solana to continue"),
                        React.createElement("ul", { className: "wallet-adapter-modal-list" },
                            listedWallets.map((wallet) => (React.createElement(WalletListItem, { key: wallet.adapter?.name, handleClick: (event) => handleWalletClick(event, wallet.adapter?.name), wallet: wallet }))),
                            collapsedWallets.length ? (React.createElement(Collapse, { expanded: expanded, id: "wallet-adapter-modal-collapse" }, collapsedWallets.map((wallet) => (React.createElement(WalletListItem, { key: wallet.adapter?.name, handleClick: (event) => handleWalletClick(event, wallet.adapter?.name), tabIndex: expanded ? 0 : -1, wallet: wallet }))))) : null),
                        collapsedWallets.length ? (React.createElement("button", { className: "wallet-adapter-modal-list-more", onClick: handleCollapseClick, tabIndex: 0 },
                            React.createElement("span", null,
                                expanded ? 'Less ' : 'More ',
                                "options"),
                            React.createElement("svg", { width: "13", height: "7", viewBox: "0 0 13 7", xmlns: "http://www.w3.org/2000/svg", className: `${expanded ? 'wallet-adapter-modal-list-more-icon-rotate' : ''}` },
                                React.createElement("path", { d: "M0.71418 1.626L5.83323 6.26188C5.91574 6.33657 6.0181 6.39652 6.13327 6.43762C6.24844 6.47872 6.37371 6.5 6.50048 6.5C6.62725 6.5 6.75252 6.47872 6.8677 6.43762C6.98287 6.39652 7.08523 6.33657 7.16774 6.26188L12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z" })))) : null)) : (React.createElement(React.Fragment, null,
                        React.createElement("h1", { className: "wallet-adapter-modal-title" }, "You'll need a wallet on Solana to continue"),
                        React.createElement("div", { className: "wallet-adapter-modal-middle" },
                            React.createElement(WalletSVG, null)),
                        collapsedWallets.length ? (React.createElement(React.Fragment, null,
                            React.createElement("button", { className: "wallet-adapter-modal-list-more", onClick: handleCollapseClick, tabIndex: 0 },
                                React.createElement("span", null,
                                    expanded ? 'Hide ' : 'Already have a wallet? View ',
                                    "options"),
                                React.createElement("svg", { width: "13", height: "7", viewBox: "0 0 13 7", xmlns: "http://www.w3.org/2000/svg", className: `${expanded ? 'wallet-adapter-modal-list-more-icon-rotate' : ''}` },
                                    React.createElement("path", { d: "M0.71418 1.626L5.83323 6.26188C5.91574 6.33657 6.0181 6.39652 6.13327 6.43762C6.24844 6.47872 6.37371 6.5 6.50048 6.5C6.62725 6.5 6.75252 6.47872 6.8677 6.43762C6.98287 6.39652 7.08523 6.33657 7.16774 6.26188L12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z" }))),
                            React.createElement(Collapse, { expanded: expanded, id: "wallet-adapter-modal-collapse" },
                                React.createElement("ul", { className: "wallet-adapter-modal-list" }, collapsedWallets.map((wallet) => (React.createElement(WalletListItem, { key: wallet.adapter?.name, handleClick: (event) => handleWalletClick(event, wallet.adapter?.name), tabIndex: expanded ? 0 : -1, wallet: wallet }))))))) : null)))),
            React.createElement("div", { className: "wallet-adapter-modal-overlay", onMouseDown: handleClose })), portal));
};
//# sourceMappingURL=WalletModal.js.map