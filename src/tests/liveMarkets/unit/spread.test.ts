import { ZERO_ODDS_AFTER_SPREAD_ADJUSTMENT } from '../../../constants/errors';
import { processMarket } from '../../../utils/markets';
import { mapOpticOddsApiFixtureOdds } from '../../../utils/opticOdds';
import { LeagueMocks } from '../mock/MockLeagueMap';
import { MockAfterSpreadZeroOdds1 } from '../mock/MockOpticSoccer';
import { mockSoccer } from '../mock/MockSoccerRedis';

describe('Spread configuration', () => {
    it('Should return zero odds for quotes that sum up total probability above 1', () => {
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
});
