import { NO_MARKETS_FOR_LEAGUE_ID } from '../../constants/errors';
import { processMarket } from '../../utils/markets';
import { mapOpticOddsApiFixtureOdds } from '../../utils/opticOdds';
import { LeagueMocks } from '../mock/MockLeagueMap';
import { MockOnlyMoneyline, MockOpticSoccer } from '../mock/MockOpticSoccer';
import { mockSoccer } from '../mock/MockSoccerRedis';

describe('Markets', () => {
    describe('LeagueMap configuration', () => {
        it('Should return an empty array for child markets when they are not added to list', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));

            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['draftkings'],
                [],
                true,
                undefined,
                undefined,
                LeagueMocks.leagueInfoOnlyParent
            );

            expect(market.childMarkets).toHaveLength(0);
        });

        it('Should return an empty array for child markets when they are disabled', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['draftkings'],
                [],
                true,
                undefined,
                undefined,
                LeagueMocks.leagueInfoMockDisabledChilds
            );

            expect(market.childMarkets).toHaveLength(0);
        });

        it('Should return only spread child markets without total child markets', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['draftkings'],
                [],
                true,
                undefined,
                undefined,
                LeagueMocks.leagueInfoEnabledSpreadDisabledTotals
            );

            const containsSpread = market.childMarkets.some((child: any) => child.type === 'spread');
            const containsTotal = market.childMarkets.some((child: any) => child.type === 'total');

            expect(containsSpread).toBe(true);
            expect(containsTotal).toBe(false);
        });

        it('Should return both totals and spread child markets', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['draftkings'],
                [],
                true,
                undefined,
                undefined,
                LeagueMocks.leagueInfoEnabledSpeadAndTotals
            );

            const containsSpread = market.childMarkets.some((child: any) => child.type === 'spread');
            const containsTotal = market.childMarkets.some((child: any) => child.type === 'total');

            expect(containsSpread).toBe(true);
            expect(containsTotal).toBe(true);
        });

        it('Should return all child markets', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOpticSoccer));
            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['draftkings'],
                [],
                true,
                undefined,
                undefined,
                LeagueMocks.leagueInfoEnabledAll
            );

            const containsSpread = market.childMarkets.some((child: any) => child.type === 'spread');
            const containsTotal = market.childMarkets.some((child: any) => child.type === 'total');
            const containsChildMoneyline = market.childMarkets.some(
                (child: any) => child.type === 'secondPeriodWinner'
            );
            const containsChildCorrectScore = market.childMarkets.some((child: any) => child.type === 'correctScore');
            const containsChildDoubleChance = market.childMarkets.some((child: any) => child.type === 'doubleChance');
            const containsChildGG = market.childMarkets.some((child: any) => child.type === 'bothTeamsToScore');
            const containsChildDrawNoBet = market.childMarkets.some((child: any) => child.type === 'drawNoBet');

            expect(containsSpread).toBe(true);
            expect(containsTotal).toBe(true);
            expect(containsChildMoneyline).toBe(true);
            expect(containsChildCorrectScore).toBe(true);
            expect(containsChildDoubleChance).toBe(true);
            expect(containsChildGG).toBe(true);
            expect(containsChildDrawNoBet).toBe(true);
        });

        it('Should return warning message that there are is no configuration available in league map csv', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneyline));
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['draftkings'],
                [],
                true,
                undefined,
                undefined,
                LeagueMocks.leagueInfoOnlyParentDiffSportId
            );

            expect(warnSpy).toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalledWith(`${NO_MARKETS_FOR_LEAGUE_ID}: ${Number(mockSoccer.leagueId)}`);

            // Restore the original implementation
            warnSpy.mockRestore();
        });
    });
});
