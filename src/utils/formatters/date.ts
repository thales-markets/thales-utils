import format from 'date-fns/format';

export const formatTxTimestamp = (timestamp: number | Date) => format(timestamp, 'MMM d, yy | HH:mm');

export const formatShortDate = (date: Date | number) => format(date, 'd MMM yyyy');

export const formatShortDateWithTime = (date: Date | number) => format(date, 'd MMM yyyy HH:mm');

export const formatHoursAndMinutesFromTimestamp = (timestamp: number) => format(timestamp, 'HH:mm');

export const formatDateWithTime = (date: Date | number) => format(date, 'dd MMM HH:mm');

export const formatTimeFromDate = (date: Date | number) => format(date, 'HH:mm');

export const convertUTCToLocalDate = (date: Date) => {
    return new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes()
    );
};

export const convertLocalToUTCDate = (date: Date) => {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()));
};

export const addHoursToCurrentDate = (numberOfHours: number, setToEOD?: boolean) => {
    const newDateFilter = new Date();
    if (setToEOD) {
        newDateFilter.setHours(23, 59, 59, 999);
        newDateFilter.setTime(newDateFilter.getTime() + numberOfHours * 60 * 60 * 1000);
    } else {
        newDateFilter.setTime(newDateFilter.getTime() + numberOfHours * 60 * 60 * 1000);
    }
    return newDateFilter;
};

export const addDaysToEnteredTimestamp = (numberOfDays: number, timestamp: number) => {
    return new Date().setTime(new Date(timestamp).getTime() + numberOfDays * 24 * 60 * 60 * 1000);
};
