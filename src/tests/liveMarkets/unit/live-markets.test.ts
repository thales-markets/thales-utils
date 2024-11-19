import { processMarket } from '../../../utils/markets';
import { mockSoccer } from '../mock/MockSoccerRedis';
import {
    MockAfterSpreadZeroOdds1,
    MockOnlyMoneyline,
    MockOnlyMoneylineWithDifferentSportsbook,
    MockOpticSoccer,
    MockZeroOdds,
} from '../mock/MockOpticSoccer';
import { mapOpticOddsApiFixtureOdds } from '../../../utils/opticOdds';
import { LeagueMocks } from '../mock/MockLeagueMap';
import {
    DIFF_BETWEEN_BOOKMAKERS_MESSAGE,
    NO_MARKETS_FOR_LEAGUE_ID,
    ZERO_ODDS_AFTER_SPREAD_ADJUSTMENT,
    ZERO_ODDS_MESSAGE,
} from '../../../constants/errors';

describe('Live Markets', () => {
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
    });
    describe('Odds configuration', () => {
        it('Should return odds for moneyline', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneyline));
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
            const hasOdds = market.odds.some(
                (odd) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
            );
            expect(hasOdds).toBe(true);
        });
        it('Should return zero odds for moneyline when one of the providers has no odds', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneyline));
            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['draftkings', 'bovada'],
                [],
                true,
                undefined,
                undefined,
                LeagueMocks.leagueInfoEnabledSpeadAndTotals
            );

            const hasOdds = market.odds.some(
                (odd) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
            );

            expect(hasOdds).toBe(false);
            expect(market).toHaveProperty('errorMessage');
            expect(market.errorMessage).toBe(ZERO_ODDS_MESSAGE);
        });

        it('Should return zero odds for moneyline', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockZeroOdds));
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

            const hasOdds = market.odds.some(
                (odd) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
            );

            expect(hasOdds).toBe(false);
            expect(market).toHaveProperty('errorMessage');
            expect(market.errorMessage).toBe(ZERO_ODDS_MESSAGE);
        });

        it('Should return zero odds for moneyline when there is quote diff between bookmakers', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneylineWithDifferentSportsbook));
            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['draftkings', 'bovada'],
                [],
                true,
                undefined,
                5,
                LeagueMocks.leagueInfoOnlyParent
            );

            const hasOdds = market.odds.some(
                (odd) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
            );

            expect(hasOdds).toBe(false);
            expect(market).toHaveProperty('errorMessage');
            expect(market.errorMessage).toBe(DIFF_BETWEEN_BOOKMAKERS_MESSAGE);
        });

        it('Should return zero odds for moneyline as no matching bookmaker was provided', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockOnlyMoneyline));
            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['bovada', 'draftkings'],
                [],
                true,
                undefined,
                undefined,
                LeagueMocks.leagueInfoEnabledSpeadAndTotals
            );
            const hasOdds = market.odds.some(
                (odd) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
            );

            expect(hasOdds).toBe(false);
            expect(market).toHaveProperty('errorMessage');
            expect(market.errorMessage).toBe(ZERO_ODDS_MESSAGE); // should be no matching bookmakers mesage
        });

        it('Should return zero odds with error for spread adjustment for quotes that sum up total probability above 1', () => {
            const freshMockSoccer = JSON.parse(JSON.stringify(mockSoccer));
            const freshMockOpticSoccer = JSON.parse(JSON.stringify(MockAfterSpreadZeroOdds1));
            const market = processMarket(
                freshMockSoccer,
                mapOpticOddsApiFixtureOdds([freshMockOpticSoccer])[0],
                ['draftkings'],
                [],
                false,
                undefined,
                undefined,
                LeagueMocks.leagueInfoEnabledSpeadAndTotals
            );
            const hasOdds = market.odds.some(
                (odd) => odd.american !== 0 || odd.decimal !== 0 || odd.normalizedImplied !== 0
            );

            expect(hasOdds).toBe(false);
            expect(market).toHaveProperty('errorMessage');
            expect(market.errorMessage).toBe(ZERO_ODDS_AFTER_SPREAD_ADJUSTMENT); // should be no matching bookmakers mesage
        });

        it('Should return zero odds for moneyline as no matching bookmaker was provided', () => {
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

// check odds cutting
// check child markets cutting
// difference between bookmakers
// zero odds handling
