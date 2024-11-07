import * as oddslib from 'oddslib';
import { DRAW, MIN_ODDS_FOR_DIFF_CHECKING, MONEYLINE_TYPE_ID, ZERO } from '../constants/common';
import { checkOddsFromBookmakers } from './bookmakers';
import { adjustSpreadOnOdds, getSpreadData } from './spread';
import { MoneylineTypes } from '../enums/sports';
import { ChildMarket, LeagueInfo } from '../types/sports';
import { getLeagueInfo } from './sports';
import { OddsObject } from '../types/odds';

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
                odd.marketName.toLowerCase() === marketName.toLowerCase() &&
                odd.sportsBookName.toLowerCase() == oddsProvider.toLowerCase() &&
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
                odd.marketName.toLowerCase() === marketName.toLowerCase() &&
                odd.sportsBookName.toLowerCase() == oddsProvider.toLowerCase() &&
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
                    odd.marketName.toLowerCase() === marketName.toLowerCase() &&
                    odd.sportsBookName.toLowerCase() == oddsProvider.toLowerCase() &&
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
    const commonData = { homeTeam: oddsApiObject.homeTeam, awayTeam: oddsApiObject.awayTeam };

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
    const spreadData = getSpreadData(sportSpreadData, sportId, MONEYLINE_TYPE_ID, defaultSpreadForLiveMarkets);

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
 * @param {Object} leagueId - leagueId AKA sportId
 * @param {Array} spreadDataForSport - Spread data for sport.
 * @param {Object} apiResponseWithOdds - API response from the provider
 * @param {Array} liveOddsProviders - Odds providers for live odds
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets
 * @param {Boolean} leagueMap - League Map info
 * @returns {Array} The child markets.
 */
export const createChildMarkets: (
    apiResponseWithOdds: OddsObject,
    spreadDataForSport: any,
    leagueId: number,
    liveOddsProviders: any,
    defaultSpreadForLiveMarkets: any,
    leagueMap: any
) => ChildMarket[] = (
    apiResponseWithOdds,
    spreadDataForSport,
    leagueId,
    liveOddsProviders,
    defaultSpreadForLiveMarkets,
    leagueMap
) => {
    const [spreadOdds, totalOdds, moneylineOdds, childMarkets]: any[] = [[], [], [], []];
    const leagueInfo = getLeagueInfo(leagueId, leagueMap);
    const commonData = {
        homeTeam: apiResponseWithOdds.homeTeam,
        awayTeam: apiResponseWithOdds.awayTeam,
    };
    if (leagueInfo.length > 0) {
        // TODO ADD ODDS COMPARISON BETWEEN BOOKMAKERS
        const allChildOdds = filterOddsByMarketNameBookmaker(
            apiResponseWithOdds.odds,
            leagueInfo,
            liveOddsProviders[0]
        );

        allChildOdds.forEach((odd) => {
            if (odd.type === 'Total') {
                if (Math.abs(Number(odd.points) % 1) === 0.5) totalOdds.push(odd);
            } else if (odd.type === 'Spread') {
                if (Math.abs(Number(odd.points) % 1) === 0.5) spreadOdds.push(odd);
            } else if (odd.type === 'Moneyline') {
                moneylineOdds.push(odd);
            }
        });

        const formattedOdds = [
            ...groupAndFormatSpreadOdds(spreadOdds, commonData),
            ...groupAndFormatTotalOdds(totalOdds, commonData),
            ...groupAndFormatMoneylineOdds(moneylineOdds, commonData),
        ];

        const oddsWithSpreadAdjusted = adjustSpreadOnChildOdds(
            formattedOdds,
            spreadDataForSport,
            defaultSpreadForLiveMarkets
        );

        oddsWithSpreadAdjusted.forEach((data) => {
            const childMarket = {
                leagueId: Number(data.sportId),
                typeId: Number(data.typeId),
                type: data.type.toLowerCase(),
                line: Number(data.line || 0),
                odds: data.odds,
            };
            const leagueInfoByTypeId = leagueInfo.find((league) => Number(league.typeId) === Number(data.typeId));
            const minOdds = leagueInfoByTypeId?.minOdds;
            const maxOdds = leagueInfoByTypeId?.maxOdds;
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
        console.warn(`No child markets for leagueID: ${Number(leagueId)}`);
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
    const allChildMarketsTypes = leagueInfos
        .filter(
            (leagueInfo) =>
                leagueInfo.marketName.toLowerCase() !== MoneylineTypes.MONEYLINE.toLowerCase() &&
                leagueInfo.enabled === 'true'
        )
        .map((leagueInfo) => leagueInfo.marketName.toLowerCase());
    return oddsArray
        .filter(
            (odd) =>
                allChildMarketsTypes.includes(odd.marketName.toLowerCase()) &&
                odd.sportsBookName.toLowerCase() == oddsProvider.toLowerCase()
        )
        .map((odd) => {
            return {
                ...odd,
                ...leagueInfos.find(
                    (leagueInfo) => leagueInfo.marketName.toLowerCase() === odd.marketName.toLowerCase()
                ), // using .find() for team totals means that we will always assign 10017 as typeID at this point
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
        const { points, marketName, price, selection, typeId, sportId, type } = odd;
        const isHomeTeam = selection === commonData.homeTeam;

        const key = `${marketName}_${isHomeTeam ? points : -points}`;

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
        const [_marketName, lineFloat] = key.split('_');
        const line = parseFloat(lineFloat);
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
export const groupAndFormatTotalOdds = (oddsArray, commonData) => {
    // Group odds by their selection points and selection
    const groupedOdds = oddsArray.reduce((acc, odd) => {
        if (odd) {
            const key = `${odd.marketName}_${odd.selection}_${odd.points}`;
            if (!acc[key]) {
                acc[key] = { over: null, under: null };
            }
            if (odd.selectionLine === 'over') {
                acc[key].over = odd.price;
            } else if (odd.selectionLine === 'under') {
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
        const [_marketName, selection, selectionLine] = key.split('_');
        const line = parseFloat(selectionLine);

        // if we have away team in total odds we know the market is team total and we need to increase typeId by one.
        // if this is false typeId is already mapped correctly
        const isAwayTeam = selection === commonData.awayTeam;
        if ((value as any).over !== null && (value as any).under !== null) {
            acc.push({
                line: line as any,
                odds: [(value as any).over, (value as any).under],
                typeId: !isAwayTeam ? value.typeId : Number(value.typeId) + 1,
                sportId: value.sportId,
                type: value.type,
            });
        }
        return acc;
    }, []);

    return formattedOdds;
};

/**
 * Groups spread odds by their lines and formats the result.
 *
 * @param {Array} oddsArray - The input array of odds objects.
 * @param {Object} commonData - The common data object containing homeTeam information.
 * @returns {Array} The grouped and formatted spread odds.
 */
export const groupAndFormatMoneylineOdds = (oddsArray, commonData) => {
    // Group odds by their selection points and selection
    const groupedOdds = oddsArray.reduce((acc: any, odd: any) => {
        const { price, selection, typeId, sportId, type } = odd;
        const key = typeId;

        if (!acc[key]) {
            acc[key] = { home: null, away: null, draw: null, typeId: null, sportId: null };
        }

        if (selection.toLowerCase() === commonData.homeTeam.toLowerCase()) acc[key].home = price;
        else if (selection.toLowerCase() === commonData.awayTeam.toLowerCase()) acc[key].away = price;
        else if (selection.toLowerCase() === DRAW.toLowerCase()) acc[key].draw = price;

        acc[key].typeId = typeId;
        acc[key].type = type;
        acc[key].sportId = sportId;

        return acc;
    }, {}) as any;
    // Format the grouped odds into the desired output
    const formattedOdds = (Object.entries(groupedOdds as any) as any).reduce((acc, [_key, value]) => {
        if ((value as any).home !== null && (value as any).away !== null) {
            acc.push({
                odds: (value as any).draw
                    ? [(value as any).home, (value as any).away, (value as any).draw]
                    : [(value as any).home, (value as any).away],
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
    const result: any[] = [];
    iterableGroupedOdds.forEach((data) => {
        const hasDrawOdds = data.odds.length === 3;
        const homeTeamOdds = convertOddsToImpl(data.odds[0]) || ZERO;
        const awayTeamOdds = convertOddsToImpl(data.odds[1]) || ZERO;
        const drawOdds = convertOddsToImpl(data.odds[2]) || ZERO;
        const odds = hasDrawOdds ? [homeTeamOdds, awayTeamOdds, drawOdds] : [homeTeamOdds, awayTeamOdds];

        const isZeroOddsChild = homeTeamOdds === ZERO || awayTeamOdds === ZERO || (hasDrawOdds && drawOdds === ZERO);
        if (!isZeroOddsChild) {
            const spreadData = getSpreadData(
                spreadDataForSport,
                data.sportId,
                data.typeId,
                defaultSpreadForLiveMarkets
            );
            let adjustedOdds;
            if (spreadData !== null) {
                adjustedOdds = adjustSpreadOnOdds(odds, spreadData.minSpread, spreadData.targetSpread);
            } else {
                adjustedOdds = adjustSpreadOnOdds(odds, defaultSpreadForLiveMarkets, 0);
            }

            result.push({
                ...data,
                odds: adjustedOdds,
            });
        }
    });
    return result;
};
