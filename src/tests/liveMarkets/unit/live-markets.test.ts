/* 
Write tests about live markets and processing market in Overtime-Live-Trading-Utils.
*/

import { processMarket } from '../../../utils/markets';

import { mockSoccer } from '../mock/MockSoccerRedis';
import { MockOnlyMoneyline, MockOpticSoccer, MockZeroOdds } from '../mock/MockOpticSoccer';
import { mapOpticOddsApiFixtureOdds } from '../../../utils/opticOdds';
import { LeagueMocks } from '../mock/MockLeagueMap';
import { ZERO_ODDS_MESSAGE } from '../../../constants/errors';

describe('Live Markets', () => {
    describe('LeagueMap configuration', () => {
        it('Should return an empty array for child markets when they are not added to list', () => {
            const market = processMarket(
                mockSoccer,
                mapOpticOddsApiFixtureOdds([MockOpticSoccer])[0],
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
            const market = processMarket(
                mockSoccer,
                mapOpticOddsApiFixtureOdds([MockOpticSoccer])[0],
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
            const market = processMarket(
                mockSoccer,
                mapOpticOddsApiFixtureOdds([MockOpticSoccer])[0],
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
            const market = processMarket(
                mockSoccer,
                mapOpticOddsApiFixtureOdds([MockOpticSoccer])[0],
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
            const market = processMarket(
                mockSoccer,
                mapOpticOddsApiFixtureOdds([MockOnlyMoneyline])[0],
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

            expect(hasOdds).toBe(true);
        });

        it('Should return zero odds for moneyline when one of the providers has no odds', () => {
            const market = processMarket(
                mockSoccer,
                mapOpticOddsApiFixtureOdds([MockOnlyMoneyline])[0],
                ['draftkings', 'bovada'],
                [],
                true,
                undefined,
                5,
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
            const market = processMarket(
                mockSoccer,
                mapOpticOddsApiFixtureOdds([MockZeroOdds])[0],
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
    });
});

// check odds cutting
// check child markets cutting
// difference between bookmakers
// zero odds handling
