import {
    PeriodResolutionData,
    PeriodScores,
    OpticOddsEvent,
    SportPeriodType,
    HALVES_PERIOD_TYPE_ID_MAPPING,
    QUARTERS_PERIOD_TYPE_ID_MAPPING,
    INNINGS_PERIOD_TYPE_ID_MAPPING,
    FULL_GAME_TYPE_IDS,
} from '../types/resolution';

/**
 * Detects completed periods for a game based on OpticOdds API event data
 * A period is considered complete if the next period (period + 1) exists in the scores
 * @param event - Event object from OpticOdds API
 * @returns PeriodResolutionData with completed periods, readiness status, and period scores
 */
export const detectCompletedPeriods = (
    event: OpticOddsEvent
): PeriodResolutionData | null => {
    const status = (event.fixture?.status || event.status || '').toLowerCase();
    const isLive = event.fixture?.is_live ?? event.is_live ?? false;

    // Extract period scores from the event
    const homePeriods = event.scores?.home?.periods || {};
    const awayPeriods = event.scores?.away?.periods || {};

    const periodScores: PeriodScores = {};
    const completedPeriods: number[] = [];

    // Parse all available periods
    const periodKeys = Object.keys(homePeriods)
        .filter((key) => key.startsWith('period_'))
        .map((key) => parseInt(key.replace('period_', '')))
        .sort((a, b) => a - b);

    if (periodKeys.length === 0) {
        return null; // No period data available
    }

    // Get current period from in_play if available (only use if numeric)
    const inPlayPeriod = event.in_play?.period;
    const currentLivePeriod = inPlayPeriod && !isNaN(parseInt(inPlayPeriod)) ? parseInt(inPlayPeriod) : null;

    // Check if game is in overtime/extra time (non-numeric period indicator)
    const isInOvertime = inPlayPeriod &&
        (inPlayPeriod.toLowerCase().includes('overtime') ||
         inPlayPeriod.toLowerCase().includes('ot') ||
         inPlayPeriod.toLowerCase().includes('extra'));

    // For each period, check if it's complete
    for (const periodNum of periodKeys) {
        const key = `period_${periodNum}`;
        const homeScore = homePeriods[key];
        const awayScore = awayPeriods[key];

        // Add this period's score
        if (homeScore !== undefined && awayScore !== undefined && !isNaN(homeScore) && !isNaN(awayScore)) {
            periodScores[`period${periodNum}`] = { home: homeScore, away: awayScore };

            // Period is complete if:
            // 1. Next period exists in periods data, OR
            // 2. Game is completed, OR
            // 3. Game is live with numeric period AND current live period is greater than this period, OR
            // 4. Game is in overtime (all regulation periods are complete)
            const nextPeriodKey = `period_${periodNum + 1}`;
            const isCompleted = status === 'completed' || status === 'complete' || status === 'finished';
            const hasNextPeriod = homePeriods[nextPeriodKey] !== undefined && awayPeriods[nextPeriodKey] !== undefined;
            const isCompletedInLiveGame = isLive && currentLivePeriod !== null && currentLivePeriod > periodNum;

            if (hasNextPeriod || isCompleted || isCompletedInLiveGame || isInOvertime) {
                completedPeriods.push(periodNum);
            }
        }
    }

    // Determine current period
    // If we have a numeric in_play period and it's greater than highest period in data, use it
    // Otherwise use highest period number from the data
    const highestPeriodInData = periodKeys.length > 0 ? Math.max(...periodKeys) : undefined;
    const currentPeriod = currentLivePeriod && currentLivePeriod > (highestPeriodInData || 0)
        ? currentLivePeriod
        : highestPeriodInData;

    return completedPeriods.length > 0
        ? {
              completedPeriods,
              readyForResolution: true,
              periodScores,
              currentPeriod,
          }
        : null;
};

/**
 * Checks if a market can be resolved based on game and sport
 * @param gameId - The game/fixture ID
 * @param event - Event object from OpticOdds API
 * @returns boolean indicating if market can be resolved
 */
export const canResolveMarketForGameIdAndSport = (
    gameId: string,
    event: OpticOddsEvent
): boolean => {
    const eventId = event.fixture?.id || event.id || '';
    if (eventId !== gameId) {
        return false;
    }

    const periodData = detectCompletedPeriods(event);
    return periodData !== null && periodData.readyForResolution;
};

/**
 * Convenience function to check resolution status via OpticOdds API event
 * @param event - Event object from OpticOdds API
 * @returns PeriodResolutionData if periods are complete, null otherwise
 */
export const canResolveMarketViaOpticOddsApi = (
    event: OpticOddsEvent
): PeriodResolutionData | null => {
    return detectCompletedPeriods(event);
};

/**
 * Selects the appropriate period-to-typeId mapping based on sport type
 * @param sportType - Sport period structure type
 * @returns Period-to-typeId mapping for the specified sport type
 */
function selectMappingForSportType(sportType: SportPeriodType): { [period: number]: number[] } {
    switch (sportType) {
        case SportPeriodType.HALVES_BASED:
            return HALVES_PERIOD_TYPE_ID_MAPPING;
        case SportPeriodType.QUARTERS_BASED:
            return QUARTERS_PERIOD_TYPE_ID_MAPPING;
        case SportPeriodType.INNINGS_BASED:
            return INNINGS_PERIOD_TYPE_ID_MAPPING;
    }
}

/**
 * Checks if a single market type can be resolved based on completed periods
 * @param event - Event object from OpticOdds API
 * @param typeId - Single market type ID to check
 * @param sportType - Sport period structure type (halves, quarters, or innings based) - REQUIRED
 * @returns boolean indicating if that typeId can be resolved
 */
export function canResolveMarketsForEvent(
    event: OpticOddsEvent,
    typeId: number,
    sportType: SportPeriodType
): boolean;

/**
 * Checks which market types can be resolved from a batch based on completed periods
 * @param event - Event object from OpticOdds API
 * @param typeIds - Array of market type IDs to check
 * @param sportType - Sport period structure type (halves, quarters, or innings based) - REQUIRED
 * @returns Array of typeIds that can be resolved
 */
export function canResolveMarketsForEvent(
    event: OpticOddsEvent,
    typeIds: number[],
    sportType: SportPeriodType
): number[];

/**
 * Implementation - checks if specific market type(s) can be resolved based on completed periods
 *
 * @example
 * // Check single typeId for NFL (quarters-based)
 * const canResolve = canResolveMarketsForEvent(event, 10021, SportPeriodType.QUARTERS_BASED);
 *
 * // Check batch of typeIds for MLB (innings-based)
 * const resolvable = canResolveMarketsForEvent(event, [10021, 10051], SportPeriodType.INNINGS_BASED);
 * // Returns: [10021] if only period 1-4 complete, [10021, 10051] if period 5 complete
 */
export function canResolveMarketsForEvent(
    event: OpticOddsEvent,
    typeIdOrTypeIds: number | number[],
    sportType: SportPeriodType
): boolean | number[] {
    // Get completed periods
    const periodData = detectCompletedPeriods(event);
    if (!periodData) {
        return Array.isArray(typeIdOrTypeIds) ? [] : false;
    }

    // Check if game is fully completed
    const status = (event.fixture?.status || event.status || '').toLowerCase();
    const isCompleted = status === 'completed' || status === 'complete' || status === 'finished';

    // Select appropriate mapping based on sport type
    const mapping = selectMappingForSportType(sportType);

    // Collect all resolvable typeIds based on completed periods
    const resolvableTypeIds = new Set<number>();

    for (const period of periodData.completedPeriods) {
        const typeIdsForPeriod = mapping[period] || [];
        typeIdsForPeriod.forEach((id) => resolvableTypeIds.add(id));
    }

    // Single typeId check
    if (typeof typeIdOrTypeIds === 'number') {
        // Full game typeIds can only be resolved when game is completed
        if (FULL_GAME_TYPE_IDS.includes(typeIdOrTypeIds)) {
            return isCompleted;
        }
        return resolvableTypeIds.has(typeIdOrTypeIds);
    }

    // Batch typeIds check
    return typeIdOrTypeIds.filter((id) => {
        // Full game typeIds can only be resolved when game is completed
        if (FULL_GAME_TYPE_IDS.includes(id)) {
            return isCompleted;
        }
        return resolvableTypeIds.has(id);
    });
};
