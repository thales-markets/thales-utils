import { Address } from 'viem';
import { NetworkId } from '../enums/network';
import { CRYPTO_CURRENCY_MAP } from './currency';

export const DATA_STREAMS_ENDPOINTS = {
    testnet: 'https://api.testnet-dataengine.chain.link',
    mainnet: 'https://api.dataengine.chain.link',
};

export const DATA_STREAMS_PATHS = {
    reports: '/api/v1/reports',
    latest: '/api/v1/reports/latest',
};

export const DATA_STREAMS_CANDLESTICK_ENDPOINTS = {
    testnet: 'https://priceapi.testnet-dataengine.chain.link',
    mainnet: 'https://priceapi.dataengine.chain.link',
};

export const DATA_STREAMS_CANDLESTICK_PATHS = {
    auth: '/api/v1/authorize',
    history: '/api/v1/history',
};

// You can find the ids of feeds at https://docs.chain.link/data-streams/crypto-streams
export const FEED_ID = {
    testnet: {
        [CRYPTO_CURRENCY_MAP.ETH]: '0x000359843a543ee2fe414dc14c7e7920ef10f4372990b79d6361cdc0dd1ba782', // ETH/USD feed id in testnet
        [CRYPTO_CURRENCY_MAP.BTC]: '0x00037da06d56d083fe599397a4769a042d63aa73dc4ef57709d31e9971a5b439', // BTC/USD feed id in testnet
    },
    mainnet: {
        [CRYPTO_CURRENCY_MAP.ETH]: '0x000362205e10b3a147d02792eccee483dca6c7b44ecce7012cb8c6e0b68b3ae9', // ETH/USD feed id in mainnet
        [CRYPTO_CURRENCY_MAP.BTC]: '0x00039d9e45394f473ab1f050a1b963e6b05351e52d71e507509ada0c95ed75b8', // BTC/USD feed id in mainnet
    },
};

// You can find at https://docs.chain.link/data-streams/crypto-streams
export const CHAINLINK_CONTRACT_ADDRESS = {
    [NetworkId.OptimismMainnet]: '0xEBA4789A88C89C18f4657ffBF47B13A3abC7EB8D' as Address,
    [NetworkId.Arbitrum]: '0x478Aa2aC9F6D65F84e09D9185d126c3a17c2a93C' as Address,
    [NetworkId.Base]: '0xDE1A28D87Afd0f546505B28AB50410A5c3a7387a' as Address,
    [NetworkId.PolygonMainnet]: '0xF276a4BC8Da323EA3E8c3c195a4E2E7615a898d1' as Address,
    [NetworkId.OptimismSepolia]: '0x5f64394a2Ab3AcE9eCC071568Fc552489a8de7AF' as Address,
};
