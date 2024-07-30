/**
 * Enum for task status codes.
 * @readonly
 * @enum {number}
 */
export const statusCodes = {
    /** Game is open and has not started. */
    OPEN: 0,
    /** Game has been temporarily halted. */
    PAUSED: 1,
    /** Game is currently underway. */
    IN_PROGRESS: 3,
    /** Game has been finished successfully. */
    FINISHED: 8,
    /** Game has been resolved successfully. */
    RESOLVED: 10,
    /** Game has been canceled and will not be finished. */
    CANCELED: 255,
};
