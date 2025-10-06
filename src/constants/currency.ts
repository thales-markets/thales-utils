import { keyBy } from 'lodash';
import { Coins } from '../types/tokens';

const CRYPTO_CURRENCY = [
    'DAI',
    'USDCe',
    'USDC',
    'USDT',
    'OP',
    'WETH',
    'ETH',
    'ARB',
    'USDbC',
    'THALES',
    'sTHALES',
    'OVER',
    'cbBTC',
    'BTC',
    'wBTC',
];
export const CRYPTO_CURRENCY_MAP = keyBy(CRYPTO_CURRENCY);

export const COLLATERAL_DECIMALS: Record<Coins, number> = {
    DAI: 18,
    USDCe: 6,
    USDbC: 6,
    USDC: 6,
    USDT: 6,
    OP: 18,
    WETH: 18,
    ETH: 18,
    ARB: 18,
    THALES: 18,
    sTHALES: 18,
    OVER: 18,
    cbBTC: 8,
    wBTC: 8,
};

export const DEFAULT_CURRENCY_DECIMALS = 2;
export const SHORT_CURRENCY_DECIMALS = 4;
export const MEDIUM_CURRENCY_DECIMALS = 6;
export const LONG_CURRENCY_DECIMALS = 8;
