import type { WalletName } from '@mindblox-wallet-adapter/base';
import type { DetailedHTMLProps, FC, ImgHTMLAttributes } from 'react';
import React from 'react';

export interface WalletIconProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
    wallet: {
      adapter?: {
        icon: string;
        name: WalletName;
      };
    } | null;
  }

export const WalletIcon: FC<WalletIconProps> = ({ wallet, ...props }) => {
    return wallet && <img src={wallet.adapter?.icon} alt={`${wallet.adapter?.name} icon`} {...props} />;
};
