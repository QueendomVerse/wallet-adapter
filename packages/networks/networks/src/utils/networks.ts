import type { ChainTicker } from '@mindblox-wallet-adapter/base';
import { ChainTickers } from '@mindblox-wallet-adapter/base';
import {
    getNetwork as getSolanaNetwork,
    WalletAdapterNetwork as SolanaWalletAdapterNetwork
} from '@mindblox-wallet-adapter/solana';
import {
    getNetwork as getNearNetwork,
    WalletAdapterNetwork as NearWalletAdapterNetwork
} from '@mindblox-wallet-adapter/near';

export enum ChainAdapterNetworks {
    Mainnet = 'mainnet',
    Testnet = 'testnet',
    Devnet = 'devnet',
    Localnet = 'localnet',
}

export type CommonAdapterNetwork = ChainAdapterNetworks;

const SolanaAdapterNetworkMap: Record<CommonAdapterNetwork, SolanaWalletAdapterNetwork> = {
    [ChainAdapterNetworks.Mainnet]: SolanaWalletAdapterNetwork.Mainnet,
    [ChainAdapterNetworks.Testnet]: SolanaWalletAdapterNetwork.Testnet,
    [ChainAdapterNetworks.Devnet]: SolanaWalletAdapterNetwork.Devnet,
    [ChainAdapterNetworks.Localnet]: SolanaWalletAdapterNetwork.Localnet,
}

const NearAdapterNetworkMap: Record<CommonAdapterNetwork, NearWalletAdapterNetwork> = {
    [ChainAdapterNetworks.Mainnet]: NearWalletAdapterNetwork.Mainnet,
    [ChainAdapterNetworks.Testnet]: NearWalletAdapterNetwork.Betanet,
    [ChainAdapterNetworks.Devnet]: NearWalletAdapterNetwork.Testnet,
    [ChainAdapterNetworks.Localnet]: NearWalletAdapterNetwork.Localnet,
}

export type ChainAdapterNetwork = SolanaWalletAdapterNetwork | NearWalletAdapterNetwork;

const isValidChainAdapterNetwork = (value: string): value is ChainAdapterNetworks =>
    Object.values(ChainAdapterNetworks).includes(value as ChainAdapterNetworks);

export const getAdapterNetwork = <CT extends ChainTicker>(
    chain: CT, network: string
): ChainAdapterNetwork => {
    if (!isValidChainAdapterNetwork(network)) {
        throw new Error(`Invalid chain adapter network: ${network}`);
    }

    const _network = (network as ChainAdapterNetworks) ?? ChainAdapterNetworks.Devnet;
    switch (chain) {
        case ChainTickers.SOL:
            return getSolanaNetwork(SolanaAdapterNetworkMap[_network]) as SolanaWalletAdapterNetwork;
        case ChainTickers.NEAR:
            return getNearNetwork(NearAdapterNetworkMap[_network]) as NearWalletAdapterNetwork;
        default:
            throw new Error('Unable to determine chain adapter network');
    }
};