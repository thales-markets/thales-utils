import * as oddslib from 'oddslib';
import { createChildMarkets, getParentOdds } from './odds';
import { OddsObject } from '../types/odds';
import { getLeagueInfo } from './sports';
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
 * @param {Boolean} isTestnet - Flag showing should we process for testnet or mainnet
 * @returns {Promise<Object|null>} A promise that resolves to the processed event object or null if the event is invalid or mapping fails.
 */
export const processMarket = (
    market: any,
    apiResponseWithOdds: OddsObject,
    liveOddsProviders: any,
    spreadData: any,
    isDrawAvailable: any,
    defaultSpreadForLiveMarkets: any,
    maxPercentageDiffBetwenOdds: any,
    leagueMap: any
) => {
    const sportSpreadData = spreadData.filter((data) => data.sportId === String(market.leagueId));
    const leagueInfo = getLeagueInfo(market.leagueId, leagueMap);

    const moneylineOdds = getParentOdds(
        !isDrawAvailable,
        sportSpreadData,
        liveOddsProviders,
        apiResponseWithOdds,
        market.leagueId,
        defaultSpreadForLiveMarkets,
        maxPercentageDiffBetwenOdds
    );

    if (moneylineOdds.errorMessage) {
        market.odds = market.odds.map(() => {
            return {
                american: 0,
                decimal: 0,
                normalizedImplied: 0,
            };
        });

        market.errorMessage = moneylineOdds.errorMessage;
    } else {
        // Pack market odds for UI
        market.odds = moneylineOdds.odds.map((probability) => {
            if (probability != 0) {
                const leagueInfoByTypeId = leagueInfo.find((league) => Number(league.typeId) === Number(market.typeId));
                let finalProbability = probability;

                if (probability < 0.95) {
                    if (leagueInfoByTypeId && Number(leagueInfoByTypeId.addedSpread)) {
                        finalProbability = (probability * (100 + Number(leagueInfoByTypeId.addedSpread))) / 100;
                        // edge case if added spread is bigger than 5%, it can happen that odd goes above 1, in that case return odd from api.
                        if (finalProbability >= 1) {
                            finalProbability = probability;
                        }
                    }
                }

                return {
                    american: oddslib.from('impliedProbability', finalProbability).to('moneyline'),
                    decimal: Number(oddslib.from('impliedProbability', finalProbability).to('decimal').toFixed(10)),
                    normalizedImplied: finalProbability,
                };
            } else {
                market.errorMessage = 'Bad odds after spread adjustment';
                return {
                    american: 0,
                    decimal: 0,
                    normalizedImplied: 0,
                };
            }
        });
    }

    const childMarkets = createChildMarkets(
        apiResponseWithOdds,
        sportSpreadData,
        market.leagueId,
        liveOddsProviders,
        defaultSpreadForLiveMarkets,
        leagueMap
    );

    const packedChildMarkets = childMarkets.map((childMarket: any) => {
        const preparedMarket = { ...market, ...childMarket };
        if (preparedMarket.odds.length > 0) {
            preparedMarket.odds = preparedMarket.odds.map((probability) => {
                if (probability == 0) {
                    return {
                        american: 0,
                        decimal: 0,
                        normalizedImplied: 0,
                    };
                }
                const leagueInfoByTypeId = leagueInfo.find(
                    (league) => Number(league.typeId) === Number(preparedMarket.typeId)
                );
                let finalProbability = probability;

                if (probability < 0.95) {
                    if (leagueInfoByTypeId && Number(leagueInfoByTypeId.addedSpread)) {
                        finalProbability = (probability * (100 + Number(leagueInfoByTypeId.addedSpread))) / 100;
                        // edge case if added spread is bigger than 5%, it can happen that odd goes above 1, in that case return odd from api.
                        if (finalProbability >= 1) {
                            finalProbability = probability;
                        }
                    }
                }
                return {
                    american: oddslib.from('impliedProbability', finalProbability).to('moneyline'),
                    decimal: Number(oddslib.from('impliedProbability', finalProbability).to('decimal').toFixed(10)),
                    normalizedImplied: finalProbability,
                };
            });
        }
        return preparedMarket;
    });
    market.childMarkets = packedChildMarkets;

    return market;
};
