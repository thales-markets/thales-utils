import { LeagueConfigInfo } from '../../types/sports';

const baseLeagueInfo: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Moneyline',
    typeId: 0,
    type: 'moneyline',
    maxOdds: 0.25,
    minOdds: 0.75,
};

const spreadMock: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Goal Spread',
    typeId: 10001,
    type: 'Spread',
    maxOdds: 0.25,
    minOdds: 0.75,
};

const totalMock: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Total Goals',
    typeId: 10002,
    type: 'Total',
    maxOdds: 0.25,
    minOdds: 0.75,
};

const doubleChanceMock: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Double Chance',
    typeId: 10003,
    type: 'Double Chance',
    maxOdds: 0.01,
    minOdds: 0.99,
};

const correctScoreMock: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: 'Correct Score',
    typeId: 10100,
    type: 'Correct Score',
    maxOdds: 0.25,
    minOdds: 0.75,
};

const childMoneylineMock: LeagueConfigInfo = {
    sportId: 9806,
    enabled: 'true',
    marketName: '1st Half Moneyline',
    typeId: 10022,
    type: 'Moneyline',
    maxOdds: 0.25,
    minOdds: 0.75,
};

const baseDiffSportId: LeagueConfigInfo = {
    ...baseLeagueInfo,
    sportId: 4,
};

// Mock Variants
const leagueInfoOnlyParent: LeagueConfigInfo[] = [baseLeagueInfo];
const leagueInfoOnlyParentWithSpreadAdded: LeagueConfigInfo[] = [{ ...baseLeagueInfo, addedSpread: 3 }];
const leagueInfoOnlyParentDiffSportId: LeagueConfigInfo[] = [baseDiffSportId];

const leagueInfoMockDisabledChilds: LeagueConfigInfo[] = [
    baseLeagueInfo,
    { ...spreadMock, enabled: 'false' },
    { ...totalMock, enabled: 'false' },
    { ...doubleChanceMock, enabled: 'false' },
    { ...correctScoreMock, enabled: 'false' },
];

const leagueInfoEnabledSpreadDisabledTotals: LeagueConfigInfo[] = [
    baseLeagueInfo,
    spreadMock,
    { ...totalMock, enabled: 'false' },
];

const leagueInfoDisabledCorrectScoreAndDoubleChance: LeagueConfigInfo[] = [
    baseLeagueInfo,
    spreadMock,
    totalMock,
    { ...doubleChanceMock, enabled: 'false' },
    { ...correctScoreMock, enabled: 'false' },
];

const leagueInfoEnabledSpeadAndTotals: LeagueConfigInfo[] = [baseLeagueInfo, spreadMock, totalMock];
const leagueInfoEnabledAll: LeagueConfigInfo[] = [
    baseLeagueInfo,
    spreadMock,
    totalMock,
    childMoneylineMock,
    doubleChanceMock,
    correctScoreMock,
];

// Grouped Exports
export const LeagueMocks = {
    leagueInfoOnlyParent,
    leagueInfoOnlyParentWithSpreadAdded,
    leagueInfoOnlyParentDiffSportId,
    leagueInfoMockDisabledChilds,
    leagueInfoEnabledSpreadDisabledTotals,
    leagueInfoEnabledSpeadAndTotals,
    leagueInfoEnabledAll,
    leagueInfoDisabledCorrectScoreAndDoubleChance,
};
