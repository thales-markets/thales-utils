export type OddsObject = {
    gameId: string;
    startDate: number;
    homeTeam: string;
    awayTeam: string;
    isLive: boolean;
    status: string;
    sport: string;
    league: string;
    odds: [
        {
            id: string;
            sportsBookName: string;
            name: string;
            price: number;
            timestamp: number;
            points: number;
            isMain: boolean;
            isLive: boolean;
            marketName: string;
            playerId: string;
            selection: string;
            selectionLine: string;
        }
    ];
};

export type ScoresObject = {
    gameId: string;
    sport: string;
    league: string;
    status: string;
    isLive: string;
    clock: string;
    period: string;
    homeTeam: string;
    awayTeam: string;
    homeTotal: string;
    awayTotal: string;
    homePeriod1: string;
    awayPeriod1: string;
    homePeriod2: string;
    awayPeriod2: string;
    homePeriod3: string;
    awayPeriod3: string;
    homePeriod4: string;
    awayPeriod4: string;
    homePeriod5: string;
    awayPeriod5: string;
};
