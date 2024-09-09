import * as oddslib from 'oddslib';
import { TAG_CHILD_SPREAD, TAG_CHILD_TOTALS, ZERO } from '../constants/common';
import { filterOddsByMarketNameBookmaker, formatSpreadOdds, getParentOdds, processTotalOdds } from './odds';
import { getLeagueSpreadType, getLeagueTotalType } from './sports';
/**
 * Processes a single sports event. This function maps event data to a specific format,
 * filters invalid events, and optionally fetches player properties if the sport supports it.
 * Returns the mapped event object or null if the event is filtered out or mapping results in a null object.
 *
 * @param {Object} market - The market API object to process
 * @param {Object} apiResponseWithOdds - Provider's API object to process
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Array} spreadData - Spread data for odds.
 * @param {Boolean} isDrawAvailable - Is it two or three-positional sport
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets
 * @param {Number} maxPercentageDiffBetwenOdds - Maximum allowed percentage difference between same position odds from different providers
 * @returns {Promise<Object|null>} A promise that resolves to the processed event object or null if the event is invalid or mapping fails.
 */
export const processMarket = (
    market,
    apiResponseWithOdds,
    liveOddsProviders,
    spreadData,
    isDrawAvailable,
    defaultSpreadForLiveMarkets,
    maxPercentageDiffBetwenOdds
) => {
    const sportSpreadData = spreadData.filter((data) => data.sportId === String(market.leagueId));

    console.log('READY TO FETCH PARENT ODDS');
    const moneylineOdds = getParentOdds(
        !isDrawAvailable,
        sportSpreadData,
        liveOddsProviders,
        apiResponseWithOdds,
        market.leagueId,
        defaultSpreadForLiveMarkets,
        maxPercentageDiffBetwenOdds
    );
    console.log('FETCHED PARENT ODDS: ', moneylineOdds);

    const isZeroParentOdds =
        moneylineOdds[0] == ZERO || moneylineOdds[1] == ZERO || (isDrawAvailable && moneylineOdds[2] == ZERO);

    if (market.odds.length > 0) {
        market.odds = market.odds.map((_odd, index) => {
            let positionOdds;
            switch (index) {
                case 0:
                    positionOdds = moneylineOdds[0];
                    break;
                case 1:
                    positionOdds = moneylineOdds[1];
                    break;
                case 2:
                    positionOdds = moneylineOdds[2];
                    break;
            }
            return {
                american: oddslib.from('impliedProbability', positionOdds).to('moneyline'),
                decimal: oddslib.from('impliedProbability', positionOdds).to('decimal'),
                normalizedImplied: positionOdds,
            };
        });
    }

    console.log('FETCHING CHILD ODDS:');
    const childMarkets = isZeroParentOdds
        ? []
        : getChildMarkets(market, sportSpreadData, apiResponseWithOdds, liveOddsProviders, defaultSpreadForLiveMarkets);
    console.log('Mapped event for game ID: ' + market.gameId);

    market.childMarkets = childMarkets;

    return market;
};

/**
 * Retrieves the child markets for the given event.
 *
 * @param {Object} market - The market object from the API
 * @param {Array} spreadDataForSport - Spread data for sport.
 * @param {Object} apiResponseWithOdds - API response from the provider
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets
 * @returns {Array} The child markets for the event.
 */
const getChildMarkets = (
    market,
    spreadDataForSport,
    apiResponseWithOdds,
    liveOddsProviders,
    defaultSpreadForLiveMarkets
) => {
    let childMarkets = [];

    // Create Spread Child Markets
    childMarkets = childMarkets.concat(
        createSpreadChildMarkets(
            apiResponseWithOdds,
            market,
            spreadDataForSport,
            liveOddsProviders,
            defaultSpreadForLiveMarkets
        )
    );

    // Create Total Child Markets
    childMarkets = childMarkets.concat(
        createTotalChildMarkets(
            apiResponseWithOdds,
            market,
            spreadDataForSport,
            liveOddsProviders,
            defaultSpreadForLiveMarkets
        )
    );

    return childMarkets;
};

/**
 * Creates spread child markets based on the given parameters.
 *
 * @param {Object} market - The market object from the API
 * @param {Array} spreadDataForSport - Spread data for sport.
 * @param {Object} apiResponseWithOdds - API response from the provider
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets
 * @returns {Array} The spread child markets.
 */
const createSpreadChildMarkets = (
    apiResponseWithOdds,
    market,
    spreadDataForSport,
    liveOddsProviders,
    defaultSpreadForLiveMarkets
) => {
    console.log('CREATING SPREAD CHILD MARKETS');
    const childMarkets = [];
    const spreadType = getLeagueSpreadType(market.leagueId);
    const commonData = {
        homeTeam: apiResponseWithOdds.home_team,
        awayTeam: apiResponseWithOdds.away_team,
    };
    if (spreadType) {
        // TODO ADD ODDS COMPARISON BETWEEN BOOKMAKERS
        const allSpreadOdds = filterOddsByMarketNameBookmaker(
            apiResponseWithOdds.odds,
            spreadType,
            liveOddsProviders[0]
        );

        if (allSpreadOdds.length > 0) {
            const formattedSpreadOdds = formatSpreadOdds(
                allSpreadOdds,
                commonData,
                market,
                spreadDataForSport,
                TAG_CHILD_SPREAD,
                defaultSpreadForLiveMarkets
            );

            childMarkets.push(...formattedSpreadOdds);
        }
    } else {
        console.warn(`Spread type for sport ID ${market.leagueId} not found.`);
    }
    console.log('RETURNING SPREAD CHILD MARKETS', childMarkets);
    return childMarkets;
};

/**
 * Creates total child markets based on the given parameters.
 *
 * @param {Object} market - The market object from the API
 * @param {Array} spreadDataForSport - Spread data for sport.
 * @param {Object} apiResponseWithOdds - API response from the provider
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets
 * @returns {Array} The total child markets.
 */
export const createTotalChildMarkets = (
    apiResponseWithOdds,
    market,
    spreadDataForSport,
    liveOddsProviders,
    defaultSpreadForLiveMarkets
) => {
    console.log('CREATING TOTAL CHILD MARKETS');
    const childMarkets = [];
    const totalType = getLeagueTotalType(market.leagueId);
    const commonData = {
        homeTeam: apiResponseWithOdds.home_team,
        awayTeam: apiResponseWithOdds.away_team,
    };

    if (totalType) {
        // TODO ADD ODDS COMPARISON BETWEEN BOOKMAKERS
        const totalOdds = filterOddsByMarketNameBookmaker(apiResponseWithOdds.odds, totalType, liveOddsProviders[0]);

        if (totalOdds.length > 0) {
            childMarkets.push(
                ...processTotalOdds(
                    totalOdds,
                    commonData,
                    market,
                    spreadDataForSport,
                    TAG_CHILD_TOTALS,
                    defaultSpreadForLiveMarkets
                )
            );
        }
    } else {
        console.warn(`Configuration (totals) for sport ID ${market.leagueId} not found.`);
    }

    console.log('RETURNING TOTAL CHILD MARKETS: ', childMarkets);
    return childMarkets;
};
