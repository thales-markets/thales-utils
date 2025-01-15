import { formatUnits, getAddress as getAddressViem, hexToString, parseUnits, stringToHex } from 'viem';
import { COLLATERAL_DECIMALS } from '../../constants/currency';
import { Coins } from '../../types/tokens';
import { getDefaultDecimalsForNetwork } from '../network';
import { countDecimals, floorNumberToDecimals } from './number';

export const bytesFormatter = (input: string) => stringToHex(input, { size: 32 });

export const parseBytes32String = (input: string) => hexToString(input as any, { size: 32 });

export const bigNumberFormatter = (value: bigint, decimals?: number) =>
    Number(formatUnits(value, decimals !== undefined ? decimals : 18));

export const coinFormatter = (value: bigint, networkId: number, currency?: Coins) => {
    const decimals = currency ? COLLATERAL_DECIMALS[currency] : getDefaultDecimalsForNetwork(networkId);

    return Number(formatUnits(value, decimals));
};

export const coinParser = (value: string, networkId: number, currency?: Coins) => {
    const decimals = currency ? COLLATERAL_DECIMALS[currency] : getDefaultDecimalsForNetwork(networkId);
    const numOfValueDecimals = countDecimals(Number(value));

    return parseUnits(floorNumberToDecimals(Number(value), decimals).toFixed(numOfValueDecimals), decimals);
};

export const getAddress = (addr: string) => getAddressViem(addr);
