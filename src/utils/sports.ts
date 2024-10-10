import { LeagueMap } from '../constants/sports';
import { League, Sport } from '../enums/sports';
import { LeagueInfo } from '../types/sports';

export const getLeagueSport = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.sport : Sport.EMPTY;
};

export const getLeagueLabel = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.label : '';
};

export const getLeagueProvider = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.provider : '';
};

export const getLeagueIsDrawAvailable = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.isDrawAvailable : false;
};

export const getLiveSupportedLeagues = (leagueMap: LeagueInfo[]) => {
    return leagueMap.map((league) => Number(league.sportId));
};

export const getBetTypesForLeague = (league: League, leagueMap: LeagueInfo[]) => {
    const betTypes = leagueMap
        .filter((leagueInfo) => Number(leagueInfo.sportId) === league)
        .map((leagueInfo) => leagueInfo.marketName);

    return betTypes;
};

export const getLeagueOpticOddsName = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.opticOddsName : undefined;
};

export const getLeaguePeriodType = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.periodType : '';
};

export const getLeagueSpreadType = (league: League, leagueMap: LeagueInfo[]) => {
    const betTypes = leagueMap
        .filter((leagueInfo) => Number(leagueInfo.sportId) === league && leagueInfo.type === 'Spread')
        .map((leagueInfo) => leagueInfo.marketName);

    return betTypes[0];
};

export const getLeagueTotalType = (league: League, leagueMap: LeagueInfo[]) => {
    const betTypes = leagueMap
        .filter((leagueInfo) => Number(leagueInfo.sportId) === league && leagueInfo.type === 'Total')
        .map((leagueInfo) => leagueInfo.marketName);

    return betTypes[0];
};
