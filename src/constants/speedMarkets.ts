import { CRYPTO_CURRENCY_MAP } from './currency';

export const SPEED_MARKETS_PRICE_DECIMALS = 8;

export const SPEED_MARKETS_SUPPORTED_ASSETS = [CRYPTO_CURRENCY_MAP.BTC, CRYPTO_CURRENCY_MAP.ETH];

export const SPEED_MARKETS_CONFIG = [
    { type: 'oracleSource', day: 'Monday', from: '', to: '', networks: [], value: '', defaultValue: 'Chainlink' },
    { type: 'oracleSource', day: 'Tuesday', from: '', to: '', networks: [], value: '', defaultValue: 'Chainlink' },
    { type: 'oracleSource', day: 'Wednesday', from: '', to: '', networks: [], value: '', defaultValue: 'Chainlink' },
    { type: 'oracleSource', day: 'Thursday', from: '', to: '', networks: [], value: '', defaultValue: 'Chainlink' },
    { type: 'oracleSource', day: 'Friday', from: '', to: '', networks: [], value: '', defaultValue: 'Chainlink' },
    { type: 'oracleSource', day: 'Saturday', from: '', to: '', networks: [], value: '', defaultValue: 'Chainlink' },
    { type: 'oracleSource', day: 'Sunday', from: '', to: '', networks: [], value: '', defaultValue: 'Chainlink' },
    { type: 'deltaTime', day: 'Monday', from: '', to: '', networks: [], value: '60', defaultValue: '0' },
    { type: 'deltaTime', day: 'Tuesday', from: '', to: '', networks: [], value: '60', defaultValue: '0' },
    { type: 'deltaTime', day: 'Wednesday', from: '', to: '', networks: [], value: '60', defaultValue: '0' },
    { type: 'deltaTime', day: 'Thursday', from: '', to: '', networks: [], value: '60', defaultValue: '0' },
    { type: 'deltaTime', day: 'Friday', from: '', to: '', networks: [], value: '60', defaultValue: '0' },
    { type: 'deltaTime', day: 'Saturday', from: '', to: '', networks: [], value: '300', defaultValue: '0' },
    { type: 'deltaTime', day: 'Sunday', from: '', to: '', networks: [], value: '300', defaultValue: '0' },
];
