import * as oddslib from 'oddslib';
import { DRAW, LIVE_TYPE_ID_BASE, MIN_ODDS_FOR_DIFF_CHECKING, MULTIPLIER_100, ZERO } from '../constants/common';
import { statusCodes } from '../enums/statuses';
import { checkOddsFromBookmakers } from './bookmakers';
import { adjustSpreadOnOdds, getSpreadData } from './spread';
import { MONEYLINE } from '../constants/constantsOpticodds';

// TODO DEPRECATE FUNCTION
export const extractOddsForGamePerProvider = (liveOddsProviders, gameWithOdds, market, teamsMap, isDrawAvailable) => {
    const linesMap = new Map<any, any>();

    liveOddsProviders.forEach((oddsProvider) => {
        const providerOddsObjects = gameWithOdds.odds.filter(
            (oddsObject) => oddsObject.sports_book_name.toLowerCase() == oddsProvider.toLowerCase()
        );

        const gameHomeTeam = teamsMap.get(market.homeTeam.toLowerCase());
        const gameAwayTeam = teamsMap.get(market.awayTeam.toLowerCase());

        let homeOddsObject;
        if (gameHomeTeam == undefined) {
            homeOddsObject = providerOddsObjects.find((oddsObject) => {
                const opticOddsTeamName = teamsMap.get(oddsObject.name.toLowerCase());

                if (opticOddsTeamName == undefined) {
                    return oddsObject.name.toLowerCase() == market.homeTeam.toLowerCase();
                } else {
                    return opticOddsTeamName == market.homeTeam.toLowerCase();
                }
            });
        } else {
            homeOddsObject = providerOddsObjects.find((oddsObject) => {
                const opticOddsTeamName = teamsMap.get(oddsObject.name.toLowerCase());

                if (opticOddsTeamName == undefined) {
                    return oddsObject.name.toLowerCase() == gameHomeTeam;
                } else {
                    return opticOddsTeamName == gameHomeTeam;
                }
            });
        }

        let homeOdds = 0;
        if (homeOddsObject != undefined) {
            homeOdds = homeOddsObject.price;
        }

        let awayOddsObject;
        if (gameAwayTeam == undefined) {
            awayOddsObject = providerOddsObjects.find((oddsObject) => {
                const opticOddsTeamName = teamsMap.get(oddsObject.name.toLowerCase());

                if (opticOddsTeamName == undefined) {
                    return oddsObject.name.toLowerCase() == market.awayTeam.toLowerCase();
                } else {
                    return opticOddsTeamName == market.awayTeam.toLowerCase();
                }
            });
        } else {
            awayOddsObject = providerOddsObjects.find((oddsObject) => {
                const opticOddsTeamName = teamsMap.get(oddsObject.name.toLowerCase());

                if (opticOddsTeamName == undefined) {
                    return oddsObject.name.toLowerCase() == gameAwayTeam;
                } else {
                    return opticOddsTeamName == gameAwayTeam;
                }
            });
        }

        let awayOdds = 0;
        if (awayOddsObject != undefined) {
            awayOdds = awayOddsObject.price;
        }

        let drawOdds = 0;
        if (isDrawAvailable) {
            const drawOddsObject = providerOddsObjects.find((oddsObject) => oddsObject.name.toLowerCase() == 'draw');

            if (drawOddsObject != undefined) {
                drawOdds = drawOddsObject.price;
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
        MONEYLINE,
        liveOddsProviders,
        commonData,
        isTwoPositionalSport
    );

    // CHECKING AND COMPARING ODDS FOR THE GIVEN BOOKMAKERS
    const oddsList = checkOddsFromBookmakers(
        moneylineOddsMap,
        liveOddsProviders,
        isTwoPositionalSport,
        maxPercentageDiffBetwenOdds,
        MIN_ODDS_FOR_DIFF_CHECKING
    );

    const isThere100PercentOdd = oddsList.some(
        (oddsObject) => oddsObject.homeOdds == 1 || oddsObject.awayOdds == 1 || oddsObject.drawOdds == 1
    );

    if (
        [oddsList[0].homeOdds, oddsList[0].awayOdds, oddsList[0].drawOdds].every((odd) => odd == ZERO) ||
        isThere100PercentOdd
    ) {
        console.log('No Moneyline odds found or there is 100% odd, returning zero odds.');
        return isTwoPositionalSport ? [0, 0] : [0, 0, 0];
    }
    const primaryBookmakerOdds = [oddsList[0].homeOdds, oddsList[0].awayOdds, oddsList[0].drawOdds];

    let parentOdds = primaryBookmakerOdds.map((odd) => convertOddsToImpl(odd));
    const spreadData = getSpreadData(sportSpreadData, sportId, LIVE_TYPE_ID_BASE, defaultSpreadForLiveMarkets);

    if (spreadData !== null) {
        parentOdds = adjustSpreadOnOdds(parentOdds, spreadData.minSpread, spreadData.targetSpread);
    } else {
        // Use min spread by sport if available, otherwise use default min spread
        parentOdds = adjustSpreadOnOdds(parentOdds, defaultSpreadForLiveMarkets, 0);
    }
    return parentOdds;
};

/**
 * Filters the odds array to find entries matching the specified market name.
 *
 * @param {Array} oddsArray - The array of odds objects.
 * @param {string} marketName - The market name to filter by.
 * @param {string} oddsProvider - The main odds provider to filter by.
 * @returns {Array} The filtered odds array.
 */
export const filterOddsByMarketNameBookmaker = (oddsArray, marketName, oddsProvider) => {
    return oddsArray.filter(
        (odd) =>
            odd.market_name.toLowerCase() === marketName.toLowerCase() &&
            odd.sports_book_name.toLowerCase() == oddsProvider.toLowerCase()
    );
};

/**
 * Formats the spread odds and creates market objects.
 *
 * @param {Array} spreadOdds - The spread odds array.
 * @param {Object} commonData - The common data object.
 * @param {Object} market - The sport ID from the API.
 * @param {Array} spreadDataForSport - Spread data for the sport.
 * @param {Number} typeId - typeID
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets,
 * @returns {Array} The formatted spread markets.
 */
export const formatSpreadOdds = (
    spreadOdds,
    commonData,
    leagueId,
    spreadDataForSport,
    typeId,
    defaultSpreadForLiveMarkets
) => {
    const validSpreadOdds = spreadOdds.filter((odd) => odd && Math.abs(odd.selection_points % 1) === 0.5) as any;

    const formattedSpreadOdds = groupAndFormatSpreadOdds(validSpreadOdds, commonData);

    return formattedSpreadOdds
        .map(({ line, odds }) => {
            // const sportTypeIdKey = `${market.leagueId}-${typeId}`;

            let homeTeamOdds = convertOddsToImpl(odds[0]) || ZERO;
            let awayTeamOdds = convertOddsToImpl(odds[1]) || ZERO;
            let isZeroOddsChild = homeTeamOdds === ZERO || awayTeamOdds === ZERO;

            // const minOdds = MIN_ODDS_RANGE_CHILDREN[sportTypeIdKey];
            // const maxOdds = MAX_ODDS_RANGE_CHILDREN[sportTypeIdKey];

            if (!isZeroOddsChild) {
                const spreadData = getSpreadData(
                    spreadDataForSport,
                    leagueId,
                    // TODO SREDITI TYPEID KOJI TREBA DA BUDE
                    typeId,
                    defaultSpreadForLiveMarkets
                );
                if (spreadData !== null) {
                    let adjustedOdds = adjustSpreadOnOdds(
                        [homeTeamOdds, awayTeamOdds],
                        spreadData.minSpread,
                        spreadData.targetSpread
                    );
                    if (adjustedOdds.some((prob) => prob === ZERO)) {
                        isZeroOddsChild = true;
                    } else {
                        [homeTeamOdds, awayTeamOdds] = adjustedOdds;
                    }
                } else {
                    let adjustedOdds = adjustSpreadOnOdds([homeTeamOdds, awayTeamOdds], defaultSpreadForLiveMarkets, 0);
                    if (adjustedOdds.some((prob) => prob === ZERO)) {
                        isZeroOddsChild = true;
                    } else {
                        [homeTeamOdds, awayTeamOdds] = adjustedOdds;
                    }
                }

                // TODO CHECK IF ANYTHING NEEDS TO BE CUT
                // const threshold = oddsThresholdChildMap[sportTypeIdKey];

                // if (
                //     configuration.fullSpreadAndTotalsCuttingSports.includes(String(market.leagueId)) ||
                //     threshold !== undefined
                // ) {
                //     const defaultThreshold = parseFloat(process.env.ODDS_THRESHOLD_CUT_DEFAULT);
                //     [homeTeamOdds, awayTeamOdds] = cutOddsCloseToValue(
                //         [homeTeamOdds, awayTeamOdds],
                //         threshold || defaultThreshold
                //     );
                // }
            }

            // const homeTeamOddsDecimal = convertOddsToDecimal(homeTeamOdds);
            // const awayTeamOddsDecimal = convertOddsToDecimal(awayTeamOdds);

            // if (
            //     minOdds !== undefined &&
            //     maxOdds !== undefined &&
            //     (homeTeamOddsDecimal * MULTIPLIER_100 < minOdds ||
            //         homeTeamOddsDecimal * MULTIPLIER_100 > maxOdds ||
            //         awayTeamOddsDecimal * MULTIPLIER_100 < minOdds ||
            //         awayTeamOddsDecimal * MULTIPLIER_100 > maxOdds)
            // ) {
            //     return null;
            // }

            return {
                leagueId,
                typeId: typeId,
                type: 'spread',
                results: [],
                status: isZeroOddsChild ? statusCodes.PAUSED : statusCodes.OPEN,
                line: line,
                odds: [homeTeamOdds, awayTeamOdds],
            };
        })
        .filter((market) => market !== null);
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
        const { selection_points, price, selection } = odd;
        const isHomeTeam = selection === commonData.homeTeam;

        const key = isHomeTeam ? selection_points : -selection_points;

        if (!acc[key]) {
            acc[key] = { home: null, away: null };
        }

        if (isHomeTeam) {
            acc[key].home = price;
        } else {
            acc[key].away = price;
        }

        return acc;
    }, {}) as any;
    // Format the grouped odds into the desired output
    const formattedOdds = (Object.entries(groupedOdds as any) as any).reduce((acc, [key, value]) => {
        const line = parseFloat(key);
        if ((value as any).home !== null && (value as any).away !== null) {
            acc.push({
                line: line as any,
                odds: [(value as any).home, (value as any).away],
            });
        }
        return acc;
    }, []);

    return formattedOdds;
};

/**
 * Processes an array of numerical odds values, setting any values greater than
 * a specified threshold to zero. This is useful for normalizing odds values in
 * contexts where excessively high odds are not desired.
 *
 * @param {Array<number>} oddsArray - An array containing numerical odds values to be processed.
 * @param {number} [threshold=0.952] - The threshold value. Any absolute value in the oddsArray greater than this threshold will be set to zero. The default threshold is 0.952 (1.05).
 * @returns {Array<number>} - An array of numerical odds where any values greater than the specified threshold have been set to zero.
 *
 */
export const cutOddsCloseToValue = (oddsArray, threshold = 0.952) => {
    return oddsArray.map((odds) => (Math.abs(odds) > threshold ? ZERO : odds));
};

/**
 * Processes total odds to create market objects.
 *
 * @param {Array} totalOdds - The total odds array.
 * @param {Object} commonData - The common data object.
 * @param {Object} market - The sport ID from the API.
 * @param {Array} spreadDataForSport - Spread data for the sport.
 * @param {Number} typeId - typeID
 * @param {Number} defaultSpreadForLiveMarkets - Default spread for live markets,
 * @returns {Array} The processed total odds market objects.
 */
export const processTotalOdds = (totalOdds, leagueId, spreadDataForSport, typeId, defaultSpreadForLiveMarkets) => {
    const childMarkets = [] as any;
    const validTotalOdds = totalOdds.filter((odd) => odd && Math.abs(odd.selection_points % 1) === 0.5);
    const groupedOdds = groupOddsBySelectionAndPoints(validTotalOdds);
    const iterableGroupedOdds = Object.entries(groupedOdds) as any;

    iterableGroupedOdds.forEach(([key, { over, under }]) => {
        const [_, selection_points] = key.split('_');

        let overOdds = convertOddsToImpl(over) || ZERO;
        let underOdds = convertOddsToImpl(under) || ZERO;
        let isZeroOddsChild = overOdds === ZERO || underOdds === ZERO;

        // const sportTypeIdKey = `${sportIdApi}-${typeId}`;
        // const minOdds = MIN_ODDS_RANGE_CHILDREN[sportTypeIdKey];
        // const maxOdds = MAX_ODDS_RANGE_CHILDREN[sportTypeIdKey];

        if (!isZeroOddsChild) {
            const spreadData = getSpreadData(spreadDataForSport, leagueId, typeId, defaultSpreadForLiveMarkets);
            if (spreadData !== null) {
                let adjustedOdds = adjustSpreadOnOdds(
                    [overOdds, underOdds],
                    spreadData.minSpread,
                    spreadData.targetSpread
                );
                if (adjustedOdds.some((prob) => prob === ZERO)) {
                    isZeroOddsChild = true;
                } else {
                    [overOdds, underOdds] = adjustedOdds;
                }
            } else {
                // Use min spread by sport if available, otherwise use default min spread
                let adjustedOdds = adjustSpreadOnOdds([overOdds, underOdds], defaultSpreadForLiveMarkets, 0);
                if (adjustedOdds.some((prob) => prob === ZERO)) {
                    isZeroOddsChild = true;
                } else {
                    [overOdds, underOdds] = adjustedOdds;
                }
            }

            // const threshold = configuration.oddsThresholdChildMap[sportTypeIdKey];

            // Apply cutOddsCloseToValue if the sport is in the list or if the threshold is defined
            // if (
            //     common.isElementInArray(configuration.fullSpreadAndTotalsCuttingSports, String(sportIdApi)) ||
            //     threshold !== undefined
            // ) {
            //     const defaultThreshold = parseFloat(process.env.ODDS_THRESHOLD_CUT_DEFAULT);
            //     [overOdds, underOdds] = common.cutOddsCloseToValue(
            //         [overOdds, underOdds],
            //         threshold || defaultThreshold
            //     );
            // }
        }

        // const overOddsDecimal = convertOddsToDecimal(overOdds);
        // const underOddsDecimal = convertOddsToDecimal(underOdds);

        // // Validate if the odds are within the specified range
        // if (
        //     minOdds !== undefined &&
        //     maxOdds !== undefined &&
        //     (overOddsDecimal * MULTIPLIER_100 < minOdds ||
        //         overOddsDecimal * MULTIPLIER_100 > maxOdds ||
        //         underOddsDecimal * MULTIPLIER_100 < minOdds ||
        //         underOddsDecimal * MULTIPLIER_100 > maxOdds)
        // ) {
        //     return;
        // }

        const childMarket = {
            leagueId,
            typeId: typeId,
            type: 'total',
            results: [],
            status: isZeroOddsChild ? statusCodes.PAUSED : statusCodes.OPEN,
            line: parseFloat(selection_points),

            odds: [overOdds, underOdds],
        };
        childMarkets.push(childMarket);
    });

    return childMarkets;
};

/**
 * Groups odds by selection and points over/under.
 *
 * @param {Array} oddsArray - The array of odds objects.
 * @returns {Object} The grouped odds.
 */
export const groupOddsBySelectionAndPoints = (oddsArray) => {
    return oddsArray.reduce((acc, odd) => {
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
        }

        return acc;
    }, {});
};
