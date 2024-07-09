import { League, Sport } from '../constants/sports';

export const allowGame = (opticOddsScoresApiResponse, marketLeague, marketSport, constraintsMap) => {
    const currentScoreHome = opticOddsScoresApiResponse.score_home_total;
    const currentScoreAway = opticOddsScoresApiResponse.score_away_total;
    const currentClock = opticOddsScoresApiResponse.clock;
    const currentPeriod = opticOddsScoresApiResponse.period;
    const currentGameStatus = opticOddsScoresApiResponse.status;
    const homeTeam = opticOddsScoresApiResponse.home_team;
    const awayTeam = opticOddsScoresApiResponse.away_team;

    if (currentGameStatus.toLowerCase() == 'completed') {
        console.log(`Blocking game ${homeTeam} - ${awayTeam} because it is no longer live.`);
        return null;
    }

    let allowedObject;
    if (marketSport === Sport.BASKETBALL) {
        allowedObject = allowGameSportWithPeriodConstraint(
            homeTeam,
            awayTeam,
            currentPeriod,
            constraintsMap.get(Sport.BASKETBALL)
        );
    }

    if (marketSport === Sport.HOCKEY) {
        allowedObject = allowGameSportWithPeriodConstraint(
            homeTeam,
            awayTeam,
            currentPeriod,
            constraintsMap.get(Sport.HOCKEY)
        );
    }

    if (marketSport === Sport.BASEBALL) {
        allowedObject = allowGameSportWithPeriodConstraint(
            homeTeam,
            awayTeam,
            currentPeriod,
            constraintsMap.get(Sport.BASEBALL)
        );
    }

    if (marketSport === Sport.SOCCER) {
        allowedObject = allowSoccerGame(homeTeam, awayTeam, currentClock, constraintsMap.get(Sport.SOCCER));
    }

    if (marketSport === Sport.TENNIS) {
        allowedObject = allowTennisMatch(
            opticOddsScoresApiResponse,
            homeTeam,
            awayTeam,
            currentPeriod,
            currentScoreHome,
            currentScoreAway,
            marketLeague
        );
    }

    return allowedObject;
};

export const allowGameSportWithPeriodConstraint = (homeTeam, awayTeam, currentPeriod, periodLimitForLiveTrade) => {
    if (Number(currentPeriod) >= periodLimitForLiveTrade) {
        return {
            allow: false,
            message: `Blocking game ${homeTeam} - ${awayTeam} due to period: ${currentPeriod}. period`,
        };
    }
    return { allow: true, message: '' };
};

export const allowSoccerGame = (homeTeam, awayTeam, currentClock, soccerMinuteLimitForLiveTrading) => {
    const currentClockNumber = Number(currentClock);
    if (
        (!Number.isNaN(currentClockNumber) && currentClockNumber >= soccerMinuteLimitForLiveTrading) ||
        (Number.isNaN(currentClockNumber) && currentClock != 'HALF')
    ) {
        return { allow: false, message: `Blocking game ${homeTeam} - ${awayTeam} due to clock: ${currentClock}min` };
    }

    return { allow: true, message: '' };
};

export const allowTennisMatch = (
    opticOddsScoresApiResponse,
    homeTeam,
    awayTeam,
    currentPeriod,
    currentScoreHome,
    currentScoreAway,
    marketLeague
) => {
    const setInProgress = Number(currentPeriod);
    let currentHomeGameScore;
    let currentAwayGameScore;

    const atpGrandSlamMatch = opticOddsScoresApiResponse.league.toLowerCase() == 'atp';
    if (marketLeague == League.TENNIS_GS && atpGrandSlamMatch) {
        if (Number(currentScoreHome) == 2 || Number(currentScoreAway) == 2) {
            switch (setInProgress) {
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
            if (Number(currentScoreHome) == 2 && currentHomeGameScore >= 5) {
                return {
                    allow: false,
                    message: `Blocking game ${homeTeam} - ${awayTeam} due to current result: ${currentScoreHome} - ${currentScoreAway} (${currentHomeGameScore} - ${currentAwayGameScore})`,
                };
            }

            if (Number(currentScoreAway) == 2 && currentAwayGameScore >= 5) {
                return {
                    allow: false,
                    message: `Blocking game ${homeTeam} - ${awayTeam} due to current result: ${currentScoreHome} - ${currentScoreAway} (${currentHomeGameScore} - ${currentAwayGameScore})`,
                };
            }
            return {
                allow: true,
                message: '',
                currentHomeGameScore: currentHomeGameScore,
                currentAwayGameScore: currentAwayGameScore,
            };
        }
    } else {
        if (Number(currentScoreHome) == 1 || Number(currentScoreAway) == 1) {
            switch (setInProgress) {
                case 2:
                    currentHomeGameScore = Number(opticOddsScoresApiResponse.score_home_period_2);
                    currentAwayGameScore = Number(opticOddsScoresApiResponse.score_away_period_2);
                    break;
                case 3:
                    currentHomeGameScore = Number(opticOddsScoresApiResponse.score_home_period_3);
                    currentAwayGameScore = Number(opticOddsScoresApiResponse.score_away_period_3);
                    break;
            }
            if (Number(currentScoreHome) == 1 && currentHomeGameScore >= 5) {
                return {
                    allow: false,
                    message: `Blocking game ${homeTeam} - ${awayTeam} due to current result: ${currentScoreHome} - ${currentScoreAway} (${currentHomeGameScore} - ${currentAwayGameScore})`,
                };
            }

            if (Number(currentScoreAway) == 1 && currentAwayGameScore >= 5) {
                return {
                    allow: false,
                    message: `Blocking game ${homeTeam} - ${awayTeam} due to current result: ${currentScoreHome} - ${currentScoreAway} (${currentHomeGameScore} - ${currentAwayGameScore})`,
                };
            }
            return {
                allow: true,
                message: '',
                currentHomeGameScore: currentHomeGameScore,
                currentAwayGameScore: currentAwayGameScore,
            };
        }
    }
};
