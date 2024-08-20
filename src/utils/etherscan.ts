import { NetworkId } from '../enums/network';

const EtherscanNetworkNameById: Record<NetworkId, string> = {
    [NetworkId.OptimismMainnet]: 'optimistic',
    [NetworkId.OptimismSepolia]: 'sepolia-optimism',
    [NetworkId.Arbitrum]: 'arbitrum-one',
    [NetworkId.Base]: 'base',
    [NetworkId.PolygonMainnet]: 'polygon-mainnet',
    [NetworkId.Mainnet]: 'mainnet',
};

const getEtherscanBaseURL = (networkId: NetworkId) => {
    const network = EtherscanNetworkNameById[networkId];

    if (networkId === NetworkId.Mainnet || network == null) {
        return 'https://etherscan.io';
    } else if (networkId === NetworkId.Arbitrum) {
        return 'https://arbiscan.io';
    } else if (networkId === NetworkId.Base) {
        return 'https://basescan.org';
    } else if (networkId === NetworkId.PolygonMainnet) {
        return 'https://polygonscan.com';
    }

    return `https://${network.toLowerCase()}.etherscan.io`;
};

export const getEtherscanTxLink = (networkId: NetworkId, txId: string) => {
    const baseURL = getEtherscanBaseURL(networkId);

    return `${baseURL}/tx/${txId}`;
};

export const getEtherscanAddressLink = (networkId: NetworkId, address: string) => {
    const baseURL = getEtherscanBaseURL(networkId);

    return `${baseURL}/address/${address}`;
};

export const getEtherscanBlockLink = (networkId: NetworkId, block: string) => {
    const baseURL = getEtherscanBaseURL(networkId);

    return `${baseURL}/block/${block}`;
};

export const getEtherscanTokenLink = (networkId: NetworkId, address: string) => {
    const baseURL = getEtherscanBaseURL(networkId);

    return `${baseURL}/token/${address}`;
};
