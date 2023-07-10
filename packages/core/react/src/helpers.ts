export const shortenAddress = (address: string, chars = 4): string =>
    `${address.slice(0, chars)}...${address.slice(-chars)}`;
