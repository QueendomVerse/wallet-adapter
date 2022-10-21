import { ParsedUrlQuery } from "querystring";

export interface NearParams extends ParsedUrlQuery {
  account_id: string;
  public_key: string;
  all_keys: string;
}
