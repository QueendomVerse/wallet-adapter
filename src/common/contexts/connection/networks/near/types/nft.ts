import { MintMetadata } from "../../../../../types";

export interface TokenData {
  id: string;
  publicKey: string;
  preview: boolean;
}

export interface Token {
  token_id: string;
  owner_id: string;
  approved_account_ids?: any[];
}

export interface TokenMetadata {
  title: string;
  description?: string;
  media?: string;
  media_hash?: string;
  copies: number;
  issued_at?: string;
  expires_at?: string;
  updated_at?: string;
  starts_at?: string;
  extra: MintMetadata;
  reference?: string;
  reference_hash?: string;
}
