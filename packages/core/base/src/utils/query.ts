import { useLocation } from 'react-router-dom';
import type { ParsedUrlQuery } from 'querystring';

export interface QueryParams extends ParsedUrlQuery {
    account_id: string;
    public_key: string;
    all_keys: string[];
    transactionHashes: string[];
}

export const useQuerySearch = () => {
    return new URLSearchParams(useLocation().search);
};
