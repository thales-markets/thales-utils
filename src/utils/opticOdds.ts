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
