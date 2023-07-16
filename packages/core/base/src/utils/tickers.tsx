import type { ChainTicker, Chain } from '../chains';
import { ChainTickers, ChainNetworks } from '../chains';
import { DEFAULT_TICKER, DEFAULT_CHAIN } from '../constants';
import { capitalizeFirst } from './helpers';

interface TickerProp {
    ticker: ChainTicker;
    network: Chain;
    shortName: string;
    fullName: string;
    toPlaceholder: string;
    logoPath: string;
    qrCode: string;
}

const tickerProps = {
    SOL: {
        ticker: ChainTickers.SOL as ChainTicker,
        network: ChainNetworks.SOL as Chain,
        shortName: ChainTickers.SOL.toLowerCase(),
        fullName: capitalizeFirst(ChainNetworks.SOL),
        toPlaceholder: 'Username/SOL address',
        logoPath: '/sol.svg',
        qrCode: '/qr-solana.svg',
    },
    NEAR: {
        ticker: ChainTickers.NEAR as ChainTicker,
        network: ChainNetworks.NEAR as Chain,
        shortName: ChainTickers.NEAR.toLowerCase(),
        fullName: capitalizeFirst(ChainNetworks.NEAR),
        toPlaceholder: 'Username/NEAR address',
        logoPath: '/near.svg',
        qrCode: '/qr-solana.svg',
    },
};

const emptyTicker: TickerProp = {
    ticker: DEFAULT_TICKER,
    network: DEFAULT_CHAIN,
    shortName: '',
    fullName: '',
    toPlaceholder: '',
    logoPath: '',
    qrCode: '',
};

export const getTickerProp = (ticker: ChainTicker): TickerProp => {
    const tickers = Object.values(ChainTickers).map((t) => t.valueOf());
    if (!tickers.includes(ticker)) {
        throw new Error(`Invalid chain ticker '${ticker}'!`);
    }

    let prop: TickerProp = emptyTicker;
    Object.entries(tickerProps).find(([key, value]) => {
        if (key === ticker) {
            prop = value as TickerProp;
        }
    });
    return prop;
};

const chainProps = {
    solana: getTickerProp(ChainTickers.SOL as ChainTicker),
    near: getTickerProp(ChainTickers.NEAR as ChainTicker),
};

export const getChainProp = (chain: Chain): TickerProp => {
    const chains = Object.values(ChainNetworks).map((t) => t.valueOf());
    if (!chains.includes(chain)) {
        throw new Error(`Invalid chain network '${chain}'!`);
    }

    let prop: TickerProp = emptyTicker;
    Object.entries(chainProps).find(([key, value]) => {
        if (key === chain) {
            prop = value;
        }
    });
    return prop;
};
