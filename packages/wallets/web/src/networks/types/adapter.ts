import type { WebWalletAdapter } from '@/adapter';
import type { BrowserWalletAdapter } from '../near';
import type { PhantomWalletAdapter } from '@wallet-adapter/phantom';
import type { Adapter } from '@wallet-adapter/base';

export type ExtendedAdapter = WebWalletAdapter | BrowserWalletAdapter | PhantomWalletAdapter | Adapter;
