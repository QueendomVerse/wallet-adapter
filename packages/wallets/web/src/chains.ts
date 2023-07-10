export const ChainTickers = {
    SOL: 'SOL',
    NEAR: 'NEAR',
};

export const ChainNetworks = {
    SOL: 'solana',
    NEAR: 'near',
};

export interface Chains {
    name: Array<typeof ChainNetworks>;
}

export type Chain = keyof typeof ChainNetworks;

export const getAdapterNameTicker = (name: string | undefined) => {
    if (!name) {
        throw new Error('Adapter name cannot be empty!');
    }

    if (name.includes('Solana')) return ChainTickers.SOL;
    if (name.includes('Near')) return ChainTickers.NEAR;

    switch (name) {
        case 'Phantom':
            return ChainTickers.SOL;
        case 'sollet.io':
            return ChainTickers.SOL;
        case 'Solflare':
            return ChainTickers.SOL;
        case 'Ledger':
            return ChainTickers.SOL;
        case 'Solong':
            return ChainTickers.SOL;
        case 'MathWallet':
            return ChainTickers.SOL;
    }

    if (name === 'WebWallet') return ChainTickers.SOL;

    throw new Error(`Unable to find ticker for adapter name '${name}'!`);
};
