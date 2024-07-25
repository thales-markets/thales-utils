import { LEAGUES_NO_FORMAL_HOME_AWAY, Sport } from '../enums/sports';
import { getLeagueSport } from './sports';

export const teamNamesMatching = (
    leagueId: number,
    marketHomeTeam: string,
    marketAwayTeam: string,
    apiHomeTeam: string,
    apiAwayTeam: string,
    teamsMap: Map<string, string>
) => {
    let homeTeamsMatch;
    let awayTeamsMatch;

    if (LEAGUES_NO_FORMAL_HOME_AWAY.includes(leagueId)) {
        homeTeamsMatch =
            apiHomeTeam.toLowerCase() == marketHomeTeam.toLowerCase() ||
            apiHomeTeam.toLowerCase() == marketAwayTeam.toLowerCase();
        awayTeamsMatch =
            apiAwayTeam.toLowerCase() == marketHomeTeam.toLowerCase() ||
            apiAwayTeam.toLowerCase() == marketAwayTeam.toLowerCase();
    } else {
        homeTeamsMatch = apiHomeTeam.toLowerCase() == marketHomeTeam.toLowerCase();
        awayTeamsMatch = apiAwayTeam.toLowerCase() == marketAwayTeam.toLowerCase();
    }

    if (homeTeamsMatch !== true) {
        const homeTeamOpticOdds = teamsMap.get(apiHomeTeam.toLowerCase());
        const gameHomeTeam = teamsMap.get(marketHomeTeam.toLowerCase());
        const gameAwayTeam = teamsMap.get(marketAwayTeam.toLowerCase());
        const hasUndefinedName = [homeTeamOpticOdds, gameHomeTeam].some((name) => name == undefined);

        if (hasUndefinedName) {
            return false;
        }

        if (LEAGUES_NO_FORMAL_HOME_AWAY.includes(leagueId)) {
            homeTeamsMatch = homeTeamOpticOdds == gameHomeTeam || homeTeamOpticOdds == gameAwayTeam;
        } else {
            homeTeamsMatch = homeTeamOpticOdds == gameHomeTeam;
        }
    }

    if (awayTeamsMatch !== true) {
        const awayTeamOpticOdds = teamsMap.get(apiAwayTeam.toLowerCase());
        const gameHomeTeam = teamsMap.get(marketHomeTeam.toLowerCase());
        const gameAwayTeam = teamsMap.get(marketAwayTeam.toLowerCase());

        const hasUndefinedName = [awayTeamOpticOdds, gameAwayTeam].some((name) => name == undefined);

        if (hasUndefinedName) {
            return false;
        }

        if (LEAGUES_NO_FORMAL_HOME_AWAY.includes(leagueId)) {
            awayTeamsMatch = awayTeamOpticOdds == gameHomeTeam || awayTeamOpticOdds == gameAwayTeam;
        } else {
            awayTeamsMatch = awayTeamOpticOdds == gameAwayTeam;
        }
    }

    return homeTeamsMatch && awayTeamsMatch;
};

export const gamesDatesMatching = (
    marketMaturityDate: Date,
    apiStartDate: Date,
    sportId: number,
    tennisDifferenceEnvVariable: number
) => {
    let datesMatch;
    const marketSport = getLeagueSport(sportId);
    if (marketSport == Sport.TENNIS) {
        const opticOddsTimestamp = apiStartDate.getTime();
        const marketTimestamp = marketMaturityDate.getTime();
        const differenceBetweenDates = Math.abs(marketTimestamp - opticOddsTimestamp);
        if (differenceBetweenDates <= Number(tennisDifferenceEnvVariable * 60 * 1000)) {
            datesMatch = true;
        } else {
            datesMatch = false;
        }
    } else {
        datesMatch = apiStartDate.toUTCString() == marketMaturityDate.toUTCString();
    }

    return datesMatch;
};
