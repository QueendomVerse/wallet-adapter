import type { TokenListContainer } from '@solana/spl-token-registry';
import { TokenListProvider } from '@solana/spl-token-registry';

let _cachedTokenListContainerPromise: Promise<TokenListContainer> | null;

export const getTokenListContainerPromise = (): Promise<TokenListContainer> | null =>
    (_cachedTokenListContainerPromise ??= new TokenListProvider().resolve());
