import { parseUnits } from 'viem';
import { SPEED_MARKETS_PRICE_DECIMALS } from '../constants/speedMarkets';
import { floorNumberToDecimals } from './formatters/number';
import { bigNumberFormatter } from './formatters/viem';

export const priceParser = (value: number) =>
    parseUnits(floorNumberToDecimals(value, SPEED_MARKETS_PRICE_DECIMALS).toString(), SPEED_MARKETS_PRICE_DECIMALS);

export const priceNumberFormatter = (value: string) => bigNumberFormatter(BigInt(value), SPEED_MARKETS_PRICE_DECIMALS);
