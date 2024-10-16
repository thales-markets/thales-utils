import * as oddslib from 'oddslib';
import { DRAW, LIVE_TYPE_ID_BASE, MIN_ODDS_FOR_DIFF_CHECKING, ZERO } from '../constants/common';
import { checkOddsFromBookmakers } from './bookmakers';
import { adjustSpreadOnOdds, getSpreadData } from './spread';
import { MoneylineTypes } from '../enums/sports';
import { LeagueInfo } from '../types/sports';
import { getLeagueInfo } from './sports';

/**
 * Converts a given odds value from one format to another.
 * Specifically, it converts from 'moneyline' to 'impliedProbability', handling special cases.
 *
 * @param {Number} odds - The odds value to convert.
 * @returns {Number} The converted odds value.
 */
const convertOddsToImpl = (odds) => {
    return odds === ZERO ? 0 : getOddsFromTo('decimal', 'impliedProbability', odds);
};

/**
 * Converts odds from one format to another.
 * @param {String} from - The original odds format.
 * @param {String} to - The target odds format.
 * @param {Number} input - The odds value.
 * @returns {Number} The converted odds.
 */
const getOddsFromTo = (from, to, input) => {
    try {
        return oddslib.from(from, input).to(to);
    } catch (error) {
        return 0;
    }
};

/**
 * Filters the odds array to find entries matching the specified market name and bookmaker.
 *
 * @param {Array} oddsArray - The array of odds objects.
 * @param {string} marketName - The market name to filter by.
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Object} commonData - The common data object.
 * @param {boolean} isTwoPositionalSport - Indicates if the sport is a two positional sport.,
 * @returns {Map} The filtered map for odds per provider.
 */
export const filterOddsByMarketNameTeamNameBookmaker = (
    oddsArray,
    marketName,
    liveOddsProviders,
    commonData,
    isTwoPositionalSport
) => {
    const linesMap = new Map<any, any>();
    liveOddsProviders.forEach((oddsProvider) => {
        let homeOdds = 0;
        const homeTeamOddsObject = oddsArray.filter((odd) => {
            return (
                odd &&
                odd.market_name.toLowerCase() === marketName.toLowerCase() &&
                odd.sports_book_name.toLowerCase() == oddsProvider.toLowerCase() &&
                odd.selection.toLowerCase() === commonData.homeTeam.toLowerCase()
            );
        });
        if (homeTeamOddsObject.length !== 0) {
            homeOdds = homeTeamOddsObject[0].price;
        }

        let awayOdds = 0;
        const awayTeamOddsObject = oddsArray.filter(
            (odd) =>
                odd &&
                odd.market_name.toLowerCase() === marketName.toLowerCase() &&
                odd.sports_book_name.toLowerCase() == oddsProvider.toLowerCase() &&
                odd.selection.toLowerCase() === commonData.awayTeam.toLowerCase()
        );

        if (awayTeamOddsObject.length !== 0) {
            awayOdds = awayTeamOddsObject[0].price;
        }

        let drawOdds = 0;
        if (!isTwoPositionalSport) {
            const drawOddsObject = oddsArray.filter(
                (odd) =>
                    odd &&
                    odd.market_name.toLowerCase() === marketName.toLowerCase() &&
                    odd.sports_book_name.toLowerCase() == oddsProvider.toLowerCase() &&
                    odd.selection.toLowerCase() === DRAW.toLowerCase()
            );

            if (drawOddsObject.length !== 0) {
                drawOdds = drawOddsObject[0].price;
            }
        }

        linesMap.set(oddsProvider.toLowerCase(), {
            homeOdds: homeOdds,
            awayOdds: awayOdds,
            drawOdds: drawOdds,
        });
    });
    return linesMap;
};

/**
 * Retrieves the parent odds for the given event.
 *
 * @param {boolean} isTwoPositionalSport - Indicates if the sport is a two positional sport.
 * @param {Array} sportSpreadData - Spread data specific to the sport.
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Object} oddsApiObject - Odds data from the API.
 * @param {String} sportId - Sport ID API.
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets,
 * @param {Number} maxPercentageDiffBetwenOdds - Maximum allowed percentage difference between same position odds from different providers
 * @returns {Array} The parent odds for the event [homeOdds, awayOdds, drawOdds].
 */
export const getParentOdds = (
    isTwoPositionalSport,
    sportSpreadData,
    liveOddsProviders,
    oddsApiObject,
    sportId,
    defaultSpreadForLiveMarkets,
    maxPercentageDiffBetwenOdds
) => {
    const commonData = { homeTeam: oddsApiObject.home_team, awayTeam: oddsApiObject.away_team };

    // EXTRACTING ODDS FROM THE RESPONSE PER MARKET NAME AND BOOKMAKER
    const moneylineOddsMap = filterOddsByMarketNameTeamNameBookmaker(
        oddsApiObject.odds,
        MoneylineTypes.MONEYLINE,
        liveOddsProviders,
        commonData,
        isTwoPositionalSport
    );

    // CHECKING AND COMPARING ODDS FOR THE GIVEN BOOKMAKERS
    const oddsObject = checkOddsFromBookmakers(
        moneylineOddsMap,
        liveOddsProviders,
        isTwoPositionalSport,
        maxPercentageDiffBetwenOdds,
        MIN_ODDS_FOR_DIFF_CHECKING
    );

    if (oddsObject.errorMessage) {
        return {
            odds: isTwoPositionalSport ? [0, 0] : [0, 0, 0],
            errorMessage: oddsObject.errorMessage,
        };
    }
    const primaryBookmakerOdds = isTwoPositionalSport
        ? [oddsObject.homeOdds, oddsObject.awayOdds]
        : [oddsObject.homeOdds, oddsObject.awayOdds, oddsObject.drawOdds];

    let parentOdds = primaryBookmakerOdds.map((odd) => convertOddsToImpl(odd));
    const spreadData = getSpreadData(sportSpreadData, sportId, LIVE_TYPE_ID_BASE, defaultSpreadForLiveMarkets);

    if (spreadData !== null) {
        parentOdds = adjustSpreadOnOdds(parentOdds, spreadData.minSpread, spreadData.targetSpread);
    } else {
        // Use min spread by sport if available, otherwise use default min spread
        parentOdds = adjustSpreadOnOdds(parentOdds, defaultSpreadForLiveMarkets, 0);
    }
    return { odds: parentOdds };
};

/**
 * Creates  child markets based on the given parameters.
 *
 * @param {Object} market - The market object from the API
 * @param {Array} spreadDataForSport - Spread data for sport.
 * @param {Object} apiResponseWithOdds - API response from the provider
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets
 * @param {Boolean} leagueMap - League Map info
 * @returns {Array} The child markets.
 */
export const createChildMarkets = (
    apiResponseWithOdds,
    market,
    spreadDataForSport,
    liveOddsProviders,
    defaultSpreadForLiveMarkets,
    leagueMap
) => {
    const [spreadOdds, totalOdds, childMarkets] = [[], [], []]; // placeholders for
    const leagueInfo = getLeagueInfo(market.leagueId, leagueMap);
    const commonData = {
        homeTeam: apiResponseWithOdds.home_team,
        awayTeam: apiResponseWithOdds.away_team,
    };
    if (leagueInfo.length > 0) {
        // TODO ADD ODDS COMPARISON BETWEEN BOOKMAKERS
        const allChildOdds = filterOddsByMarketNameBookmaker(
            apiResponseWithOdds.odds,
            leagueInfo,
            liveOddsProviders[0]
        );

        const allValidOdds = allChildOdds.filter((odd) => odd && Math.abs(odd.selection_points % 1) === 0.5) as any;

        allValidOdds.forEach((odd) => {
            if (odd && Math.abs(odd.selection_points % 1) === 0.5) {
                if (odd.type === 'Total') {
                    totalOdds.push(odd);
                } else if (odd.type === 'Spread') {
                    spreadOdds.push(odd);
                }
            }
        });

        const formattedOdds = [
            ...groupAndFormatSpreadOdds(spreadOdds, commonData),
            ...groupOddsBySelectionAndPoints(totalOdds),
        ];

        const oddsWithSpreadAdjusted = adjustSpreadOnChildOdds(
            formattedOdds,
            spreadDataForSport,
            defaultSpreadForLiveMarkets
        );

        oddsWithSpreadAdjusted.forEach((data) => {
            const minOdds = process.env.MIN_ODDS_FOR_CHILD_MARKETS_FOR_LIVE;
            const maxOdds = process.env.MAX_ODDS_FOR_CHILD_MARKETS_FOR_LIVE;

            const childMarket = {
                leagueId: data.sportId,
                typeId: data.typeId,
                type: data.type,
                line: data.line,
                odds: data.odds,
            };

            if (
                !(
                    minOdds &&
                    maxOdds &&
                    (data.odds[0] >= minOdds ||
                        data.odds[0] <= maxOdds ||
                        data.odds[1] >= minOdds ||
                        data.odds[1] <= maxOdds)
                )
            ) {
                childMarkets.push(childMarket);
            }
        });
    } else {
        console.warn(`No child markets for leagueID: ${market.leagueId}`);
    }
    return childMarkets;
};

/**
 * Filters the odds array to find entries matching the specified market name.
 *
 * @param {Array} oddsArray - The array of odds objects.
 * @param {string} leagueInfos - The market names to filter by.
 * @param {string} oddsProvider - The main odds provider to filter by.
 * @returns {Array} The filtered odds array.
 */
export const filterOddsByMarketNameBookmaker = (oddsArray, leagueInfos: LeagueInfo[], oddsProvider) => {
    const allChildMarketsTypes = leagueInfos.map((leagueInfo) => leagueInfo.marketName);
    return oddsArray
        .filter(
            (odd) =>
                allChildMarketsTypes.includes(odd.market_name.toLowerCase()) &&
                odd.market_name.toLowerCase() !== MoneylineTypes.MONEYLINE.toLowerCase() &&
                odd.sports_book_name.toLowerCase() == oddsProvider.toLowerCase()
        )
        .map((odd) => {
            return {
                ...odd,
                ...leagueInfos.find((leagueInfo) => leagueInfo.marketName === odd.market_name),
            };
        });
};

/**
 * Groups spread odds by their lines and formats the result.
 *
 * @param {Array} oddsArray - The input array of odds objects.
 * @param {Object} commonData - The common data object containing homeTeam information.
 * @returns {Array} The grouped and formatted spread odds.
 */
export const groupAndFormatSpreadOdds = (oddsArray, commonData) => {
    // Group odds by their selection points and selection
    const groupedOdds = oddsArray.reduce((acc: any, odd: any) => {
        const { selection_points, price, selection, typeId, sportId, type } = odd;
        const isHomeTeam = selection === commonData.homeTeam;

        const key = isHomeTeam ? selection_points : -selection_points;

        if (!acc[key]) {
            acc[key] = { home: null, away: null, typeId: null, sportId: null };
        }

        if (isHomeTeam) {
            acc[key].home = price;
        } else {
            acc[key].away = price;
        }

        acc[key].typeId = typeId;
        acc[key].type = type;
        acc[key].sportId = sportId;

        return acc;
    }, {}) as any;
    // Format the grouped odds into the desired output
    const formattedOdds = (Object.entries(groupedOdds as any) as any).reduce((acc, [key, value]) => {
        const line = parseFloat(key);
        if ((value as any).home !== null && (value as any).away !== null) {
            acc.push({
                line: line as any,
                odds: [(value as any).home, (value as any).away],
                typeId: value.typeId,
                sportId: value.sportId,
                type: value.type,
            });
        }
        return acc;
    }, []);

    return formattedOdds;
};

/**
 * Groups odds by selection and points over/under.
 *
 * @param {Array} oddsArray - The array of odds objects.
 * @returns {Object} The grouped odds.
 */
export const groupOddsBySelectionAndPoints = (oddsArray) => {
    // Group odds by their selection points and selection
    const groupedOdds = oddsArray.reduce((acc, odd) => {
        if (odd) {
            const key = `${odd.selection}_${odd.selection_points}`;
            if (!acc[key]) {
                acc[key] = { over: null, under: null };
            }
            if (odd.selection_line === 'over') {
                acc[key].over = odd.price;
            } else if (odd.selection_line === 'under') {
                acc[key].under = odd.price;
            }

            acc[key].typeId = odd.typeId;
            acc[key].type = odd.type;
            acc[key].sportId = odd.sportId;
        }

        return acc;
    }, {});

    // Format the grouped odds into the desired output
    const formattedOdds = (Object.entries(groupedOdds as any) as any).reduce((acc, [key, value]) => {
        const line = parseFloat(key);
        if ((value as any).over !== null && (value as any).under !== null) {
            acc.push({
                line: line as any,
                odds: [(value as any).over, (value as any).under],
                typeId: value.typeId,
                sportId: value.sportId,
                type: value.type,
            });
        }
        return acc;
    }, []);

    return formattedOdds;
};

export const adjustSpreadOnChildOdds = (iterableGroupedOdds, spreadDataForSport, defaultSpreadForLiveMarkets) => {
    const result = [];
    iterableGroupedOdds.forEach((data) => {
        let homeTeamOdds = convertOddsToImpl(data.odds[0]) || ZERO;
        let awayTeamOdds = convertOddsToImpl(data.odds[1]) || ZERO;
        let isZeroOddsChild = homeTeamOdds === ZERO || awayTeamOdds === ZERO;
        if (!isZeroOddsChild) {
            const spreadData = getSpreadData(
                spreadDataForSport,
                data.sportId,
                data.typeId,
                defaultSpreadForLiveMarkets
            );
            let adjustedOdds;
            if (spreadData !== null) {
                adjustedOdds = adjustSpreadOnOdds(
                    [homeTeamOdds, awayTeamOdds],
                    spreadData.minSpread,
                    spreadData.targetSpread
                );
            } else {
                adjustedOdds = adjustSpreadOnOdds([homeTeamOdds, awayTeamOdds], defaultSpreadForLiveMarkets, 0);
            }
            [homeTeamOdds, awayTeamOdds] = adjustedOdds;
            result.push({
                ...data,
                odds: adjustedOdds,
            });
        }
    });
    return result;
};
