import { parseUnits } from 'viem';
import { SPEED_MARKETS_CONFIG, SPEED_MARKETS_PRICE_DECIMALS } from '../constants/speedMarkets';
import { OracleSource } from '../enums/priceOracles';
import { ConfigItemType } from '../enums/speedMarkets';
import { ConfigItem, DeltaTimeChange } from '../types/speedMarkets';
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
export const getCurrentOracleSource = (
    networkId: number,
    config = SPEED_MARKETS_CONFIG as ConfigItem[]
): OracleSource => {
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
export const getCurrentMinDeltaTime = (networkId: number, config = SPEED_MARKETS_CONFIG as ConfigItem[]): number => {
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

/**
 * Returns the next upcoming deltaTime change for a given network based on config.
 * It checks today and the next 6 days to find the next change in deltaTime.
 *
 * @param networkId - The network ID to match against config entries
 * @param config - Optional config array; defaults to SPEED_MARKETS_CONFIG
 * @returns Object with:
 *   - nextChangeTime: Date object when the deltaTime will change
 *   - deltaTime: The value of deltaTime at that change
 *   - or null if no change is found in the next 7 days
 */
export const getNextDeltaTimeChange = (networkId: number, config = SPEED_MARKETS_CONFIG): DeltaTimeChange | null => {
    const now = new Date();
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let offset = 0; offset < 7; offset++) {
        // loop through today + next 6 days
        const dayIndex = (now.getUTCDay() + offset) % 7;
        const dayName = daysOfWeek[dayIndex];

        const dayEntries = config.filter(
            (item) =>
                item.type.toLowerCase() === 'deltatime' &&
                item.day === dayName &&
                (!item.networks?.length || item.networks.includes(networkId))
        );

        // Sort by 'from' minutes (start of range)
        const sortedEntries = dayEntries.sort((a, b) => {
            const aMinutes = a.from ? parseTimeToMinutes(a.from) : 0;
            const bMinutes = b.from ? parseTimeToMinutes(b.from) : 0;
            return aMinutes - bMinutes;
        });

        for (const entry of sortedEntries) {
            const fromMinutes = entry.from ? parseTimeToMinutes(entry.from) : 0;

            if (offset === 0 && fromMinutes <= currentMinutes) continue; // skip past ranges for today

            // compute next change date
            const nextDate = new Date(now);
            nextDate.setUTCDate(now.getUTCDate() + offset);
            nextDate.setUTCHours(Math.floor(fromMinutes / 60), fromMinutes % 60, 0, 0);

            const nextChangeTime = nextDate;
            const deltaTime = Number(entry.value);

            if (deltaTime !== getCurrentMinDeltaTime(networkId, (config = SPEED_MARKETS_CONFIG as ConfigItem[]))) {
                return {
                    nextChangeTime,
                    deltaTime,
                };
            }

            return null;
        }
    }

    // no upcoming changes in the next 7 days
    return null;
};
