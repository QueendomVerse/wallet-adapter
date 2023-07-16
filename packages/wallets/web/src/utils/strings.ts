export const toUTF8Array = (str: string): number[] =>
    Array.from(str).reduce((utf8: number[], _, i: number) => {
        const charcode = str.charCodeAt(i);
        return utf8.concat(
            charcode < 0x80
                ? [charcode]
                : charcode < 0x800
                ? [0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f)]
                : charcode < 0xd800 || charcode >= 0xe000
                ? [0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f)]
                : (() => {
                      i++;
                      const code = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
                      return [
                          0xf0 | (code >> 18),
                          0x80 | ((code >> 12) & 0x3f),
                          0x80 | ((code >> 6) & 0x3f),
                          0x80 | (code & 0x3f),
                      ];
                  })()
        );
    }, []);

export const fromUTF8Array = (data: number[]): string =>
    data.reduce((str: string, value: number, i: number) => {
        return (str +=
            value < 0x80
                ? String.fromCharCode(value)
                : value > 0xbf && value < 0xe0
                ? String.fromCharCode(((value & 0x1f) << 6) | (data[i + 1] & 0x3f))
                : value > 0xdf && value < 0xf0
                ? String.fromCharCode(((value & 0x0f) << 12) | ((data[i + 1] & 0x3f) << 6) | (data[i + 2] & 0x3f))
                : (() => {
                      const code =
                          (((value & 0x07) << 18) |
                              ((data[i + 1] & 0x3f) << 12) |
                              ((data[i + 2] & 0x3f) << 6) |
                              (data[i + 3] & 0x3f)) -
                          0x010000;
                      return String.fromCharCode((code >> 10) | 0xd800, (code & 0x03ff) | 0xdc00);
                  })());
    }, '');

export const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatNumber = {
    format: (val?: number) =>
        val
            ? new Intl.NumberFormat('en-US', {
                  style: 'decimal',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              }).format(val)
            : '--',
};

export const formatPct = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const abbreviateNumber = (number: number, precision: number) => {
    const tier = (Math.log10(number) / 3) | 0;
    let scaled = number;
    const suffix = ['', 'k', 'M', 'G', 'T', 'P', 'E'][tier];
    if (tier !== 0) {
        const scale = Math.pow(10, tier * 3);
        scaled = number / scale;
    }
    return scaled.toFixed(precision) + suffix;
};

export const formatAmount = (val: number, precision = 2, abbr = true) =>
    abbr ? abbreviateNumber(val, precision) : val.toFixed(precision);

export const formatPriceNumber = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
});

export const STABLE_COINS = new Set(['USDC', 'wUSDC', 'USDT']);
export const intArrayToString = (array: Uint8Array) => JSON.stringify(Array.from(array));
