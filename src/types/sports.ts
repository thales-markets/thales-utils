import { League, MatchResolveType, PeriodType, Provider, ScoringType, Sport } from '../enums/sports';

export type LeagueInfo = {
    sportId: number;
    typeId: number;
    marketName: string;
    type: string;
    enabled: string;
    minOdds: number;
    maxOdds: number;
    addedSpread?: number;
};

export type LeagueData = {
    sport: Sport;
    id: League;
    label: string;
    opticOddsName?: string;
    provider: Provider;
    // logo?: string;
    // logoClass?: string;
    scoringType: ScoringType;
    matchResolveType: MatchResolveType;
    periodType: PeriodType;
    isDrawAvailable: boolean;
    // priority: number;
    // hidden: boolean;
    // tooltipKey?: string;
};

export type ChildMarket = {
    leagueId: number;
    typeId: number;
    type: string;
    line: number;
    odds: Array<number>;
};
