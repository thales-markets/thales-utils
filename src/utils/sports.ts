import { LeagueMap } from '../constants/sports';
import { League, Sport, SpreadTypes, TotalTypes } from '../enums/sports';

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

export const getLiveSupportedLeagues = (testnet?: boolean) => {
    const allLeagues = Object.values(LeagueMap);
    return allLeagues
        .filter((league) => (testnet ? league.betTypesForLiveTestnet.length > 0 : league.betTypesForLive.length > 0))
        .map((league) => league.id);
};

export const getBetTypesForLeague = (league: League, testnet?: boolean) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? (testnet ? leagueInfo.betTypesForLiveTestnet : leagueInfo.betTypesForLive) : [];
};

export const getIsLiveSupported = (league: League, testnet?: boolean) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo
        ? testnet
            ? leagueInfo.betTypesForLiveTestnet.length > 0
            : leagueInfo.betTypesForLive.length > 0
        : false;
};

export const getLeagueOpticOddsName = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.opticOddsName : undefined;
};

export const getLeaguePeriodType = (league: League) => {
    const leagueInfo = LeagueMap[league];
    return leagueInfo ? leagueInfo.periodType : '';
};

export const getLeagueSpreadType = (league: League, testnet?: boolean) => {
    const leagueInfo = LeagueMap[league];
    const liveBetTypesForLeague = testnet ? leagueInfo.betTypesForLiveTestnet : leagueInfo.betTypesForLive;
    liveBetTypesForLeague.forEach((betType) => {
        if (Object.values(SpreadTypes).includes(betType)) {
            return betType;
        }
    });
    return undefined;
};

export const getLeagueTotalType = (league: League, testnet?: boolean) => {
    const leagueInfo = LeagueMap[league];
    const liveBetTypesForLeague = testnet ? leagueInfo.betTypesForLiveTestnet : leagueInfo.betTypesForLive;
    liveBetTypesForLeague.forEach((betType) => {
        if (Object.values(TotalTypes).includes(betType)) {
            return betType;
        }
    });
    return undefined;
};
