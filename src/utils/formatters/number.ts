import numbro from 'numbro';
import {
    DEFAULT_CURRENCY_DECIMALS,
    LONG_CURRENCY_DECIMALS,
    MEDIUM_CURRENCY_DECIMALS,
    SHORT_CURRENCY_DECIMALS,
} from '../../constants/currency';

type NumericValue = string | number;

// TODO: figure out a robust way to get the correct precision.
export const getPrecision = (amount: NumericValue) => {
    if (Number(amount) >= 1) {
        return DEFAULT_CURRENCY_DECIMALS;
    }
    if (Number(amount) >= 0.01) {
        return SHORT_CURRENCY_DECIMALS;
    }
    if (Number(amount) >= 0.0001) {
        return MEDIUM_CURRENCY_DECIMALS;
    }
    return LONG_CURRENCY_DECIMALS;
};

// TODO - refactor format methods to use only one with options as parameters
export const formatCurrency = (value: NumericValue, decimals = DEFAULT_CURRENCY_DECIMALS, trimDecimals = false) => {
    if (!value || !Number(value)) {
        return 0;
    }

    return numbro(value).format({
        thousandSeparated: true,
        trimMantissa: trimDecimals,
        mantissa: decimals,
    });
};

export const formatCurrencyWithPrecision = (value: NumericValue, trimDecimals = false) =>
    formatCurrency(value, getPrecision(value), trimDecimals);

// TODO: use a library for this, because the sign does not always appear on the left. (perhaps something like number.toLocaleString)
export const formatCurrencyWithSign = (
    sign: string | null | undefined,
    value: NumericValue,
    decimals?: number,
    trimDecimals?: boolean
) => {
    return `${Number(value) < 0 ? '- ' : ''}${sign ? sign + ' ' : ''}${formatCurrency(
        typeof value == 'number' ? Math.abs(value) : value,
        decimals !== undefined ? decimals : getPrecision(value),
        trimDecimals
    )}`;
};

export const formatCurrencyWithKey = (
    currencyKey: string,
    value: NumericValue,
    decimals?: number,
    trimDecimals?: boolean
) => `${formatCurrency(value, decimals || getPrecision(value), trimDecimals)} ${currencyKey}`;

export const formatPercentage = (value: NumericValue, decimals = DEFAULT_CURRENCY_DECIMALS) => {
    let percentageValue = value;
    if (!value || !Number(value)) {
        percentageValue = 0;
    }

    return numbro(percentageValue).format({
        output: 'percent',
        mantissa: decimals,
    });
};

export const formatPercentageWithSign = (value: NumericValue, decimals = DEFAULT_CURRENCY_DECIMALS) =>
    `${Number(value) > 0 ? '+' : ''}${formatPercentage(value, decimals)}`;

export const ceilNumberToDecimals = (value: number, decimals = DEFAULT_CURRENCY_DECIMALS) => {
    return Math.ceil(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const floorNumberToDecimals = (value: number, decimals = DEFAULT_CURRENCY_DECIMALS) => {
    return Math.floor(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const roundNumberToDecimals = (value: number, decimals = DEFAULT_CURRENCY_DECIMALS) => {
    return +(Math.round(Number(value + 'e+' + decimals)) + 'e-' + decimals);
};

export const countDecimals = (value: number) => {
    if (Math.floor(value) === value) return 0;

    const str = value.toString();
    if (str.indexOf('.') !== -1 && str.indexOf('-') !== -1) {
        return Number(str.split('-')[1]) || 0;
    } else if (str.indexOf('.') !== -1) {
        return str.split('.')[1].length || 0;
    }
    return Number(str.split('-')[1]) || 0;
};

// Bug: when number has more than 6 decimals with preceding zeros (e.g. 0.0000001), toString() returns string in exponential notation (e.g. 1e-7)
export const truncToDecimals = (value: NumericValue, decimals = DEFAULT_CURRENCY_DECIMALS): string => {
    const matchedValue = value.toString().match(`^-?\\\d+(?:\\\.\\\d{0,${decimals}})?`);
    return matchedValue !== null ? matchedValue[0] : '0';
};
