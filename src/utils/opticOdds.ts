import bytes32 from 'bytes32';
import { OPTIC_ODDS_ID_SEPARATOR, OVERTIME_ID_SEPARATOR } from '../constants/common';
import { LeagueIdMapOpticOdds } from '../constants/sports';

export const mapOpticOddsApiFixtures = (fixturesData) =>
    fixturesData.map((fixtureData) => ({
        gameId: fixtureData.id, // fixture_id
        startDate: fixtureData.start_date,
        homeTeam: fixtureData.home_team_display,
        awayTeam: fixtureData.away_team_display,
    }));

export const mapOpticOddsApiResults = (resultsData) =>
    resultsData.map((resultData: any) => ({
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
    }));

export const mapOpticOddsApiFixtureOdds = (oddsDataArray) =>
    oddsDataArray.map((oddsData) => ({
        gameId: oddsData.id, // fixture_id
        startDate: oddsData.start_date,
        homeTeam: oddsData.home_team_display,
        awayTeam: oddsData.away_team_display,
        isLive: oddsData.is_live,
        status: oddsData.status,
        sport: oddsData.sport.id,
        league: oddsData.league.name,
        odds: oddsData.odds.map((oddsObj) => ({
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
    }));

const mapScorePeriods = (periods, homeAwayType) =>
    Object.values(periods).reduce(
        (acc: any, periodValue, index) => ({
            ...acc,
            [`${homeAwayType}Period${index + 1}`]: periodValue,
        }),
        {}
    ) as any;

export const convertFromBytes32 = (value) => {
    const result = bytes32({ input: value });
    return result.replace(/\0/g, '');
};

export const formatOpticOddsLeagueName = (leagueName: string) => leagueName.replace(' ', '_').toLowerCase();

export const mapFromOpticOddsToOvertimeFormat = (fixtureId: string) => {
    if (!fixtureId.includes(OPTIC_ODDS_ID_SEPARATOR)) {
        return fixtureId;
    }
    const [leagueName, id] = fixtureId.split(':');
    const overtimeLeagueId = Object.keys(LeagueIdMapOpticOdds).find(
        (key) => formatOpticOddsLeagueName(LeagueIdMapOpticOdds[key]) === leagueName
    );
    if (!overtimeLeagueId) {
        throw `Optic Odds league ${leagueName} not mapped.`;
    }
    return `${overtimeLeagueId}${OVERTIME_ID_SEPARATOR}${id}`;
};

export const mapFromOvertimeToOpticOddsFormat = (gameId: string) => {
    if (!gameId.includes(OVERTIME_ID_SEPARATOR)) {
        return gameId;
    }
    const [leagueId, id] = gameId.split(':');
    const opticOddsLeagueName = LeagueIdMapOpticOdds[Number(leagueId)];
    if (!opticOddsLeagueName) {
        throw `Overtime league ID ${leagueId} not mapped.`;
    }
    return `${formatOpticOddsLeagueName(opticOddsLeagueName)}${OPTIC_ODDS_ID_SEPARATOR}${id}`;
};

export const mapFromOpticOddsFormatToBytes32 = (fixtureId: string) =>
    bytes32({ input: mapFromOpticOddsToOvertimeFormat(fixtureId) });

export const mapFromBytes32ToOpticOddsFormat = (gameId: string) =>
    mapFromOvertimeToOpticOddsFormat(convertFromBytes32(gameId));
