import { Coins } from '../types/tokens';

export const COLLATERAL_DECIMALS: Record<Coins, number> = {
    sUSD: 18,
    DAI: 18,
    USDCe: 6,
    USDbC: 6,
    USDC: 6,
    USDT: 6,
    BUSD: 18,
    OP: 18,
    WETH: 18,
    ETH: 18,
    ARB: 18,
    THALES: 18,
    sTHALES: 18,
};

export const DEFAULT_CURRENCY_DECIMALS = 2;
export const SHORT_CURRENCY_DECIMALS = 4;
export const MEDIUM_CURRENCY_DECIMALS = 6;
export const LONG_CURRENCY_DECIMALS = 8;
