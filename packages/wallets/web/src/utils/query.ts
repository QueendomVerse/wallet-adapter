import { useMemo } from 'react';
import type { ParsedUrlQuery } from 'querystring';

export interface QueryParams extends ParsedUrlQuery {
    account_id: string;
    public_key: string;
    all_keys: string[];
    transactionHashes: string[];
}

export const useQuerySearch = (location?: Location) => {
    const searchParams = useMemo(() => new URLSearchParams(location?.search), [location]);

    return searchParams;
};
