import type {
    Creator,
    Attribute,
    FileOrString,
    MetadataCategory,
} from '@mindblox-wallet-adapter/base/lib/types/networks/solana/metadata';

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
