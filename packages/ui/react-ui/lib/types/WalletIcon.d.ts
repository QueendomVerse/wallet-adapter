import type { WalletName } from '@mindblox-wallet-adapter/base';
import type { DetailedHTMLProps, FC, ImgHTMLAttributes } from 'react';
export interface WalletIconProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
    wallet: {
        adapter?: {
            icon: string;
            name: WalletName;
        };
    } | null;
}
export declare const WalletIcon: FC<WalletIconProps>;
//# sourceMappingURL=WalletIcon.d.ts.map