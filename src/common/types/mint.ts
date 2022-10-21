import { Attribute, Creator, FileOrString, MetadataCategory } from "..";

export interface MintMetadata {
  name: string;
  symbol: string;
  creators: Creator[] | null;
  description: string;
  sellerFeeBasisPoints: number;
  image: string;
  animation_url: string | undefined;
  attributes: Attribute[] | undefined;
  external_url: string;
  properties: {
    story: string;
    item_id: string;
    files: FileOrString[] | undefined;
    category: MetadataCategory;
  };
}
