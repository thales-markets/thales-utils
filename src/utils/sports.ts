import {
    LeagueMap,
    TENNIS_ATP_GRAND_SLAM_SET_THRESHOLD,
    TENNIS_GEMS_LIMIT,
    TENNIS_MASTERS_SET_THRESHOLD,
    VOLLEYBALL_FIFTH_SET_POINTS_LIMIT,
    VOLLEYBALL_POINTS_LIMIT,
    VOLLEYBALL_SET_THRESHOLD,
} from '../constants/sports';
import { League, Sport } from '../enums/sports';

export const getLeagueSport = (league: number) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.sport : Sport.EMPTY;
};

export const checkGameContraints = (opticOddsScoresApiResponse, marketLeague, constraintsMap) => {
    const currentScoreHome = opticOddsScoresApiResponse.score_home_total;
    const currentScoreAway = opticOddsScoresApiResponse.score_away_total;
    const currentClock = opticOddsScoresApiResponse.clock;
    const currentPeriod = opticOddsScoresApiResponse.period;
    const currentGameStatus = opticOddsScoresApiResponse.status;
    const homeTeam = opticOddsScoresApiResponse.home_team;
    const awayTeam = opticOddsScoresApiResponse.away_team;
    const currentPeriodNumber = parseInt(currentPeriod);
    const marketSport = getLeagueSport(marketLeague);

    if (currentGameStatus.toLowerCase() == 'completed') {
        return {
            allow: false,
            message: `Blocking game ${homeTeam} - ${awayTeam} because it is no longer live.`,
        };
    }

    if (marketSport === Sport.BASKETBALL) {
        return allowGameSportWithPeriodConstraint(
            homeTeam,
            awayTeam,
            currentPeriodNumber,
            constraintsMap.get(Sport.BASKETBALL)
        );
    }

    if (marketSport === Sport.HOCKEY) {
        return allowGameSportWithPeriodConstraint(
            homeTeam,
            awayTeam,
            currentPeriodNumber,
            constraintsMap.get(Sport.HOCKEY)
        );
    }

    if (marketSport === Sport.BASEBALL) {
        return allowGameSportWithPeriodConstraint(
            homeTeam,
            awayTeam,
            currentPeriodNumber,
            constraintsMap.get(Sport.BASEBALL)
        );
    }

    if (marketSport === Sport.SOCCER) {
        return allowSoccerGame(homeTeam, awayTeam, currentClock, currentPeriod, constraintsMap.get(Sport.SOCCER));
    }

    if (marketSport === Sport.TENNIS) {
        return allowGameSportWithResultConstraint(
            opticOddsScoresApiResponse,
            homeTeam,
            awayTeam,
            currentPeriod,
            currentScoreHome,
            currentScoreAway,
            marketLeague,
            marketSport
        );
    }

    if (marketSport === Sport.VOLLEYBALL) {
        return allowGameSportWithResultConstraint(
            opticOddsScoresApiResponse,
            homeTeam,
            awayTeam,
            currentPeriodNumber,
            currentScoreHome,
            currentScoreAway,
            marketLeague,
            marketSport
        );
    }

    return {
        allow: true,
        message: `The sport ${marketLeague} does not have constraint`,
    };
};

export const allowGameSportWithPeriodConstraint = (homeTeam, awayTeam, currentPeriod, periodLimitForLiveTrade) => {
    if (!Number.isNaN(currentPeriod) && currentPeriod >= periodLimitForLiveTrade) {
        return {
            allow: false,
            message: `Blocking game ${homeTeam} - ${awayTeam} due to period: ${currentPeriod}. period`,
        };
    }
    return { allow: true, message: '' };
};

export const allowSoccerGame = (homeTeam, awayTeam, currentClock, currentPeriod, soccerMinuteLimitForLiveTrading) => {
    const currentClockNumber = Number(currentClock);
    if (
        (!Number.isNaN(currentClockNumber) && currentClockNumber >= soccerMinuteLimitForLiveTrading) ||
        (Number.isNaN(currentClockNumber) && currentPeriod != 'HALF')
    ) {
        return { allow: false, message: `Blocking game ${homeTeam} - ${awayTeam} due to clock: ${currentClock}min` };
    }

    return { allow: true, message: '' };
};

export const allowGameSportWithResultConstraint = (
    opticOddsScoresApiResponse,
    homeTeam,
    awayTeam,
    currentPeriod,
    currentScoreHome,
    currentScoreAway,
    marketLeague,
    marketSport
) => {
    const setInProgress = Number(currentPeriod);
    const currentResultInSet = fetchResultInCurrentSet(setInProgress, opticOddsScoresApiResponse);
    const atpGrandSlamMatch = opticOddsScoresApiResponse.league.toLowerCase() == 'atp';
    const currentSetsScore = { home: currentScoreHome, away: currentScoreAway };

    if (marketSport == Sport.VOLLEYBALL) {
        if (setInProgress == 5) {
            return checkResultConstraint(
                homeTeam,
                awayTeam,
                currentResultInSet,
                currentSetsScore,
                VOLLEYBALL_SET_THRESHOLD,
                VOLLEYBALL_FIFTH_SET_POINTS_LIMIT
            );
        } else {
            return checkResultConstraint(
                homeTeam,
                awayTeam,
                currentResultInSet,
                currentSetsScore,
                VOLLEYBALL_SET_THRESHOLD,
                VOLLEYBALL_POINTS_LIMIT
            );
        }
    }

    if (marketLeague.toString().startsWith(League.TENNIS_GS) && atpGrandSlamMatch) {
        return checkResultConstraint(
            homeTeam,
            awayTeam,
            currentResultInSet,
            currentSetsScore,
            TENNIS_ATP_GRAND_SLAM_SET_THRESHOLD,
            TENNIS_GEMS_LIMIT
        );
    }

    if (
        (marketLeague.toString().startsWith(League.TENNIS_GS) && !atpGrandSlamMatch) ||
        marketLeague.toString().startsWith(League.TENNIS_MASTERS) ||
        marketLeague.toString().startsWith(League.SUMMER_OLYMPICS_TENNIS)
    ) {
        return checkResultConstraint(
            homeTeam,
            awayTeam,
            currentResultInSet,
            currentSetsScore,
            TENNIS_MASTERS_SET_THRESHOLD,
            TENNIS_GEMS_LIMIT
        );
    }

    return {
        allow: true,
        message: `The sport ${marketLeague} does not have result constraint`,
    };
};

export const fetchResultInCurrentSet = (currentSet: number, opticOddsScoresApiResponse) => {
    let currentHomeGameScore = 0;
    let currentAwayGameScore = 0;
    switch (currentSet) {
        case 2:
            currentHomeGameScore = Number(opticOddsScoresApiResponse.score_home_period_2);
            currentAwayGameScore = Number(opticOddsScoresApiResponse.score_away_period_2);
            break;
        case 3:
            currentHomeGameScore = Number(opticOddsScoresApiResponse.score_home_period_3);
            currentAwayGameScore = Number(opticOddsScoresApiResponse.score_away_period_3);
            break;
        case 4:
            currentHomeGameScore = Number(opticOddsScoresApiResponse.score_home_period_4);
            currentAwayGameScore = Number(opticOddsScoresApiResponse.score_away_period_4);
            break;
        case 5:
            currentHomeGameScore = Number(opticOddsScoresApiResponse.score_home_period_5);
            currentAwayGameScore = Number(opticOddsScoresApiResponse.score_away_period_5);
            break;
    }
    return { home: currentHomeGameScore, away: currentAwayGameScore };
};

const checkResultConstraint = (homeTeam, awayTeam, currentResultInSet, currentSetsWon, setThreshold, resultLimit) => {
    if (Number(currentSetsWon.home) == setThreshold || Number(currentSetsWon.away) == setThreshold) {
        if (Number(currentSetsWon.home) == setThreshold && currentResultInSet.home >= resultLimit) {
            return {
                allow: false,
                message: `Blocking game ${homeTeam} - ${awayTeam} due to current result: ${currentSetsWon.home} - ${currentSetsWon.away} (${currentResultInSet.home} - ${currentResultInSet.away})`,
            };
        }

        if (Number(currentSetsWon.away) == setThreshold && currentResultInSet.away >= resultLimit) {
            return {
                allow: false,
                message: `Blocking game ${homeTeam} - ${awayTeam} due to current result: ${currentSetsWon.home} - ${currentSetsWon.away} (${currentResultInSet.home} - ${currentResultInSet.away})`,
            };
        }
        return {
            allow: true,
            message: '',
            currentHomeGameScore: currentResultInSet.home,
            currentAwayGameScore: currentResultInSet.away,
        };
    }
    return {
        allow: true,
        message: '',
        currentHomeGameScore: currentResultInSet.home,
        currentAwayGameScore: currentResultInSet.away,
    };
};
