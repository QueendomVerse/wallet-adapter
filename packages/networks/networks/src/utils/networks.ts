import type { ChainTicker } from '@mindblox-wallet-adapter/base';
import { ChainTickers } from '@mindblox-wallet-adapter/base';
import { getSolanaNetwork, SolanaWalletAdapterNetwork, getNearNetwork, NearWalletAdapterNetwork } from '..';

export enum ChainAdapterNetwork {
    Mainnet = 'mainnet',
    Testnet = 'testnet',
    Devnet = 'devnet',
    Localnet = 'localnet',
}

const SolanaAdapterNetworkMap: Record<ChainAdapterNetwork, SolanaWalletAdapterNetwork> = {
    mainnet: SolanaWalletAdapterNetwork.Mainnet,
    testnet: SolanaWalletAdapterNetwork.Testnet,
    devnet: SolanaWalletAdapterNetwork.Devnet,
    localnet: SolanaWalletAdapterNetwork.Localnet,
};

const NearAdapterNetworkMap: Record<ChainAdapterNetwork, NearWalletAdapterNetwork> = {
    mainnet: NearWalletAdapterNetwork.Mainnet,
    testnet: NearWalletAdapterNetwork.Betanet,
    devnet: NearWalletAdapterNetwork.Testnet,
    localnet: NearWalletAdapterNetwork.Localnet,
};

export type ChainAdapterNetworks = SolanaWalletAdapterNetwork | NearWalletAdapterNetwork;

const isValidChainAdapterNetwork = (value: string): value is ChainAdapterNetwork =>
    Object.values(ChainAdapterNetwork).includes(value as ChainAdapterNetwork);

export const getAdapterNetwork = <CT extends ChainTicker>(chain: CT, network: string): ChainAdapterNetworks => {
    if (!isValidChainAdapterNetwork(network)) {
        throw new Error(`Invalid chain adapter network: ${network}`);
    }

    const _network = (network as ChainAdapterNetwork) ?? ChainAdapterNetwork.Devnet;
    switch (chain) {
        case ChainTickers.SOL:
            return getSolanaNetwork(SolanaAdapterNetworkMap[_network]) as SolanaWalletAdapterNetwork;
        case ChainTickers.NEAR:
            return getNearNetwork(NearAdapterNetworkMap[_network]) as NearWalletAdapterNetwork;
        default:
            throw new Error('Unable to determine chain adapter network');
    }
};
