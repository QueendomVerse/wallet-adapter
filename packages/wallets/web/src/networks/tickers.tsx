import type { WalletName } from '@base';
import { capitalizeFirst } from '@base';

import { ChainTickers, ChainNetworks } from '../chains';

import type { LocalKeyPair } from '../store';
import type { DbWallet } from '../indexDb';

interface TickerProp {
    ticker: string;
    network: string;
    shortName: string;
    fullName: string;
    toPlaceholder: string;
    logoPath: string;
    qrCode: string;
}

const tickerProps = {
    SOL: {
        ticker: ChainTickers.SOL,
        network: ChainNetworks.SOL,
        shortName: ChainTickers.SOL.toLowerCase(),
        fullName: capitalizeFirst(ChainNetworks.SOL),
        toPlaceholder: 'Username/SOL address',
        logoPath: '/sol.svg',
        qrCode: '/qr-solana.svg',
    },
    NEAR: {
        ticker: ChainTickers.NEAR,
        network: ChainNetworks.NEAR,
        shortName: ChainTickers.NEAR.toLowerCase(),
        fullName: capitalizeFirst(ChainNetworks.NEAR),
        toPlaceholder: 'Username/NEAR address',
        logoPath: '/near.svg',
        qrCode: '/qr-solana.svg',
    },
};

const emptyTicker: TickerProp = {
    ticker: '',
    network: '',
    shortName: '',
    fullName: '',
    toPlaceholder: '',
    logoPath: '',
    qrCode: '',
};

export const getTickerProp = (ticker: string): TickerProp => {
    // console.warn(`func: getTickerProp '${ticker}'`);
    const tickers = Object.values(ChainTickers).map((t) => t.valueOf());
    if (!tickers.includes(ticker)) {
        throw new Error(`Invalid chain ticker '${ticker}'!`);
    }

    let prop: TickerProp = emptyTicker;
    Object.entries(tickerProps).find(([key, value]) => {
        if (key === ticker) {
            // console.debug(`key: ${key} chain: ${value.fullName}`)
            prop = value as TickerProp;
        }
    });
    // console.dir(prop)
    return prop;
};

const chainProps = {
    solana: getTickerProp(ChainTickers.SOL),
    near: getTickerProp(ChainTickers.NEAR),
};

export const getChainProp = (chain: string): TickerProp => {
    // console.warn(`func: getChainProp '${chain}'`);
    const chains = Object.values(ChainNetworks).map((t) => t.valueOf());
    if (!chains.includes(chain)) {
        throw new Error(`Invalid chain network '${chain}'!`);
    }

    let prop: TickerProp = emptyTicker;
    Object.entries(chainProps).find(([key, value]) => {
        if (key === chain) {
            // console.debug(`key: ${key} chain: ${value.fullName}`)
            prop = value;
        }
    });
    // console.dir(prop)
    return prop;
};

// const { Option } = Select;

//@TODO move this to a better location
export interface SelectedWallet {
    name: WalletName;
    wallet: DbWallet;
    keypair: LocalKeyPair;
}
