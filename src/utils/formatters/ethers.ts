import { BigNumberish, ethers } from 'ethers';
import { COLLATERAL_DECIMALS } from '../../constants/currency';
import { Coins } from '../../types/tokens';
import { floorNumberToDecimals } from '../../utils/formatters/number';
import { getDefaultDecimalsForNetwork } from '../../utils/network';

export const bytesFormatter = (input: string) => ethers.utils.formatBytes32String(input);

export const parseBytes32String = (input: string) => ethers.utils.parseBytes32String(input);

export const bigNumberFormatter = (value: BigNumberish, decimals?: number) =>
    Number(ethers.utils.formatUnits(value, decimals !== undefined ? decimals : 18));

export const coinFormatter = (value: BigNumberish, networkId: number, currency?: Coins, isDeprecated?: boolean) => {
    const decimals = currency ? COLLATERAL_DECIMALS[currency] : getDefaultDecimalsForNetwork(networkId, isDeprecated);

    return Number(ethers.utils.formatUnits(value, decimals));
};

export const coinParser = (value: string, networkId: number, currency?: Coins, isDeprecated?: boolean) => {
    const decimals = currency ? COLLATERAL_DECIMALS[currency] : getDefaultDecimalsForNetwork(networkId, isDeprecated);

    return ethers.utils.parseUnits(floorNumberToDecimals(Number(value), decimals).toString(), decimals);
};

export const getAddress = (addr: string) => ethers.utils.getAddress(addr);
