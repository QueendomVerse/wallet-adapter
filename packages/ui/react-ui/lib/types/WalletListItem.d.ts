import type { FC, MouseEventHandler } from 'react';
import { SolanaWallet } from '@mindblox-wallet-adapter/solana';
export interface WalletListItemProps {
    handleClick: MouseEventHandler<HTMLButtonElement>;
    tabIndex?: number;
    wallet: SolanaWallet;
}
export declare const WalletListItem: FC<WalletListItemProps>;
//# sourceMappingURL=WalletListItem.d.ts.map