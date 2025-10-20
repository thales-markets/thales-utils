import { parseUnits } from 'viem';
import { SPEED_MARKETS_CONFIG, SPEED_MARKETS_PRICE_DECIMALS } from '../constants/speedMarkets';
import { OracleSource } from '../enums/priceOracles';
import { ConfigItemType } from '../enums/speedMarkets';
import { ConfigItem } from '../types/speedMarkets';
import { floorNumberToDecimals } from './formatters/number';
import { bigNumberFormatter } from './formatters/viem';

export const priceParser = (value: number) =>
    parseUnits(floorNumberToDecimals(value, SPEED_MARKETS_PRICE_DECIMALS).toString(), SPEED_MARKETS_PRICE_DECIMALS);

export const priceNumberFormatter = (value: string) => bigNumberFormatter(BigInt(value), SPEED_MARKETS_PRICE_DECIMALS);

/** Helper: convert "HH:MM" to total minutes */
const parseTimeToMinutes = (str: string): number => {
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
};

/**
 * Returns the oracle source value for the current UTC day and time.
 * @param config The configuration array.
 * @param networkId The network name to match.
 */
export const getOracleSource = (networkId: number, config = SPEED_MARKETS_CONFIG as ConfigItem[]): OracleSource => {
    const now = new Date();
    const currentDay = now.toLocaleString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    const entry = config.find(
        (configItem) =>
            configItem.type.toLowerCase() === ConfigItemType.ORACLE_SOURCE.toLowerCase() &&
            configItem.day === currentDay
    );

    if (!entry) {
        return OracleSource.Pyth;
    }

    const { from, to, networks, value, defaultValue } = entry;

    const fromMinutes = from ? parseTimeToMinutes(from) : 0; // midnight default
    const toMinutes = to ? parseTimeToMinutes(to) : 24 * 60; // end of day
    const inTimeRange = currentMinutes >= fromMinutes && currentMinutes <= toMinutes;

    // Match network (empty means "all")
    const networkMatch = !networks?.length || networks.includes(networkId);

    // Return value if all conditions are met
    if (inTimeRange && networkMatch && value) {
        return value.toLowerCase() === 'chainlink' ? OracleSource.Chainlink : OracleSource.Pyth;
    }

    // Otherwise fallback to default
    return defaultValue.toLowerCase() === 'chainlink' ? OracleSource.Chainlink : OracleSource.Pyth;
};

/**
 * Returns the min delta time value for the current UTC day and time.
 * @param config The configuration array.
 * @param networkId The network name to match.
 */
export const getMinDeltaTime = (networkId: number, config = SPEED_MARKETS_CONFIG as ConfigItem[]): number => {
    const now = new Date();
    const currentDay = now.toLocaleString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    const entry = config.find(
        (configItem) =>
            configItem.type.toLowerCase() === ConfigItemType.DELTA_TIME.toLowerCase() && configItem.day === currentDay
    );

    if (!entry) {
        return 0;
    }

    const { from, to, networks, value, defaultValue } = entry;

    const fromMinutes = from ? parseTimeToMinutes(from) : 0; // midnight default
    const toMinutes = to ? parseTimeToMinutes(to) : 24 * 60; // end of day
    const inTimeRange = currentMinutes >= fromMinutes && currentMinutes <= toMinutes;

    // Match network (empty means "all")
    const networkMatch = !networks?.length || networks.includes(networkId);

    // Return value if all conditions are met
    if (inTimeRange && networkMatch && value) {
        return Number(value);
    }

    // Otherwise fallback to default
    return Number(defaultValue);
};
