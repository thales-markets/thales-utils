import { LeagueMap } from '../constants/sports';
import { League, Sport } from '../enums/sports';
import { LeagueInfo } from '../types/sports';

// Methods that use data from LeagueMap defined in constants in utils
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

export const getLeaguePeriodType = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.periodType : '';
};

export const getLeagueOpticOddsName = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.opticOddsName : undefined;
};

// Methods are using data from live-markets-map.csv
export const getLiveSupportedLeagues = (leagueInfoArray: LeagueInfo[]) => {
    const uniqueId = new Set();
    leagueInfoArray
        .filter((leagueInfo) => leagueInfo.enabled === 'true')
        .map((league) => uniqueId.add(Number(league.sportId)));
    return Array.from(uniqueId);
};

export const getBetTypesForLeague = (league: League, leagueInfoArray: LeagueInfo[]) => {
    const uniqueMarketNames = new Set();
    leagueInfoArray
        .filter((leagueInfo) => Number(leagueInfo.sportId) === Number(league) && leagueInfo.enabled === 'true')
        .map((leagueInfo) => uniqueMarketNames.add(leagueInfo.marketName));

    return Array.from(uniqueMarketNames) as string[];
};

export const getLeagueInfo = (league: League, leagueInfoArray: LeagueInfo[]) => {
    const leagueInfos = leagueInfoArray.filter((leagueInfo) => Number(leagueInfo.sportId) === league);
    return leagueInfos;
};

export const getLeagueSpreadTypes = (league: League, leagueInfoArray: LeagueInfo[]) => {
    const betTypes = leagueInfoArray
        .filter(
            (leagueInfo) =>
                Number(leagueInfo.sportId) === Number(league) &&
                leagueInfo.type === 'Spread' &&
                leagueInfo.enabled === 'true'
        )
        .map((leagueInfo) => leagueInfo.marketName.toLowerCase());

    return betTypes;
};

export const getLeagueTotalTypes = (league: League, leagueInfoArray: LeagueInfo[]) => {
    const betTypes = leagueInfoArray
        .filter(
            (leagueInfo) =>
                Number(leagueInfo.sportId) === Number(league) &&
                leagueInfo.type === 'Total' &&
                leagueInfo.enabled === 'true'
        )
        .map((leagueInfo) => leagueInfo.marketName.toLowerCase());

    return betTypes;
};
