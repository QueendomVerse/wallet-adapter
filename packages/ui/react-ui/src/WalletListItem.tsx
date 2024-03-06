import { WalletReadyState } from '@mindblox-wallet-adapter/base';
import type { FC, MouseEventHandler } from 'react';
import React from 'react';
import { Button } from './Button.js';
import { WalletIcon } from './WalletIcon.js';
import { SolanaWallet } from '@mindblox-wallet-adapter/solana';

export interface WalletListItemProps {
    handleClick: MouseEventHandler<HTMLButtonElement>;
    tabIndex?: number;
    wallet: SolanaWallet;
}

export const WalletListItem: FC<WalletListItemProps> = ({ handleClick, tabIndex, wallet }) => {
    return (
        <li>
            <Button onClick={handleClick} startIcon={<WalletIcon wallet={wallet} />} tabIndex={tabIndex}>
                {wallet.adapter?.name}
                {wallet.readyState === WalletReadyState.Installed && <span>Detected</span>}
            </Button>
        </li>
    );
};
