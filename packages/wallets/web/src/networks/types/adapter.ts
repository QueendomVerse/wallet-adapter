import type { WebWalletAdapter } from '@/adapter';
import type { BrowserWalletAdapter } from '../near';
import type { PhantomWalletAdapter } from '@mindblox-wallet-adapter/phantom';
import type { Adapter } from '@mindblox-wallet-adapter/base';

export type ExtendedAdapter = WebWalletAdapter | BrowserWalletAdapter | PhantomWalletAdapter | Adapter;
