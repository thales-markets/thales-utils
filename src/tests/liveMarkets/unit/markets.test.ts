import { processMarket } from '../../../utils/markets';
import { mockSoccer } from '../mock/MockSoccerRedis';
import { MockOnlyMoneyline, MockOpticSoccer } from '../mock/MockOpticSoccer';
import { mapOpticOddsApiFixtureOdds } from '../../../utils/opticOdds';
import { LeagueMocks } from '../mock/MockLeagueMap';
import { NO_MARKETS_FOR_LEAGUE_ID } from '../../../constants/errors';

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

            const containsSpread = market.childMarkets.some((child) => child.type === 'spread');
            const containsTotal = market.childMarkets.some((child) => child.type === 'total');

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

            const containsSpread = market.childMarkets.some((child) => child.type === 'spread');
            const containsTotal = market.childMarkets.some((child) => child.type === 'total');

            expect(containsSpread).toBe(true);
            expect(containsTotal).toBe(true);
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
            expect(warnSpy).toHaveBeenCalledWith(NO_MARKETS_FOR_LEAGUE_ID);

            // Restore the original implementation
            warnSpy.mockRestore();
        });
    });
});
