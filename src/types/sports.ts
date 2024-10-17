export type LeagueInfo = {
    sportId: number;
    typeId: number;
    marketName: string;
    type: string;
    enabled: string;
};

export type ChildMarket = {
    leagueId: number;
    typeId: number;
    type: string;
    line: number;
    odds: Array<number>;
};
