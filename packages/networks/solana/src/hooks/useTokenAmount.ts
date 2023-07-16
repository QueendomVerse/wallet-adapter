import type { Token } from '@saberhq/token-utils';
import { TokenAmount } from '@saberhq/token-utils';
import { useMemo } from 'react';

export const useTokenAmount = (
    token: Token | null | undefined,
    valueStr: string | null | undefined
): TokenAmount | null | undefined =>
    useMemo(() => (token && valueStr ? tryParseTokenAmount(token, valueStr) : null), [token, valueStr]);

const tryParseTokenAmount = (token: Token, valueStr: string): TokenAmount | null => {
    try {
        return TokenAmount.parse(token, valueStr);
    } catch {
        return null;
    }
};
