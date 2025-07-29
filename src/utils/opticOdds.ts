import { Fixture, OddsObject, ScoresObject } from '../types/odds';

export const mapOpticOddsApiFixtures = (fixturesData: any[]): Fixture[] =>
    fixturesData.map(
        (fixtureData) =>
            ({
                gameId: fixtureData.id, // fixture_id
                startDate: fixtureData.start_date,
                homeTeam: fixtureData.home_team_display,
                awayTeam: fixtureData.away_team_display,
            } as Fixture)
    );

export const mapOpticOddsApiResults = (resultsData: any[]): ScoresObject[] =>
    resultsData.map(
        (resultData) =>
            ({
                gameId: resultData.fixture.id, // fixture_id
                sport: resultData.sport.name,
                league: resultData.league.name.toLowerCase(),
                status: resultData.fixture.status ? resultData.fixture.status.toLowerCase() : resultData.fixture.status,
                isLive: resultData.fixture.is_live,
                clock: resultData.in_play.clock,
                period: resultData.in_play.period ? resultData.in_play.period.toLowerCase() : resultData.in_play.period,
                homeTeam: resultData.fixture.home_team_display,
                awayTeam: resultData.fixture.away_team_display,
                homeTotal: resultData.scores.home.total,
                awayTotal: resultData.scores.away.total,
                ...mapScorePeriods(resultData.scores.home.periods, 'home'),
                ...mapScorePeriods(resultData.scores.away.periods, 'away'),
            } as ScoresObject)
    );

export const mapOpticOddsApiFixtureOdds = (oddsDataArray: any[]): OddsObject[] =>
    oddsDataArray.map(
        (oddsData) =>
            ({
                gameId: oddsData.id, // fixture_id
                startDate: oddsData.start_date,
                homeTeam: oddsData.home_team_display,
                awayTeam: oddsData.away_team_display,
                isLive: oddsData.is_live,
                status: oddsData.status,
                sport: oddsData.sport.id,
                league: oddsData.league.name,
                odds: oddsData.odds.map((oddsObj: any) => ({
                    id: oddsObj.id, // 39920-20584-2024-35:draftkings:2nd_set_moneyline:francisco_comesana
                    sportsBookName: oddsObj.sportsbook,
                    name: oddsObj.name,
                    price: oddsObj.price,
                    timestamp: oddsObj.timestamp,
                    points: oddsObj.points,
                    isMain: oddsObj.is_main,
                    isLive: oddsData.is_live,
                    marketName: oddsObj.market.toLowerCase(),
                    playerId: oddsObj.player_id,
                    selection: oddsObj.selection,
                    selectionLine: oddsObj.selection_line,
                })),
            } as OddsObject)
    );

const mapScorePeriods = (periods: any, homeAwayType: string) =>
    Object.entries(periods).reduce((acc, period) => {
        const periodKey = period[0].split('_')[1];
        const periodValue = period[1];
        return {
            ...acc,
            [`${homeAwayType}Period${periodKey}`]: periodValue,
        };
    }, {});
