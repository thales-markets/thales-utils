import { 
    mapFromOpticOddsToOvertimeFormat, 
    formatOpticOddsLeagueName,
    mapFromOvertimeToOpticOddsFormat,
    mapFromOpticOddsFormatToBytes32,
    mapFromBytes32ToOpticOddsFormat,
    convertFromBytes32
} from '../../utils/opticOdds';
import { OPTIC_ODDS_ID_SEPARATOR, OVERTIME_ID_SEPARATOR } from '../../constants/common';

// Mock the overtime-utils module
jest.mock('overtime-utils', () => ({
    LeagueMap: {
        9002: {
            id: 9002,
            name: 'Premier League',
            opticOddsName: 'English Premier League',
        },
        9001: {
            id: 9001,
            name: 'Bundesliga',
            opticOddsName: 'German Bundesliga',
        },
        9003: {
            id: 9003,
            name: 'La Liga',
            opticOddsName: 'Spanish La Liga',
        },
        9005: {
            id: 9005,
            name: 'Champions League',
            opticOddsName: 'UEFA Champions League',
        },
        9006: {
            id: 9006,
            name: 'NBA',
            opticOddsName: 'National Basketball Association',
        }
    },
    getLeagueOpticOddsName: jest.fn((leagueId: number) => {
        const leagueMap: { [key: number]: string } = {
            9002: 'English Premier League',
            9001: 'German Bundesliga',
            9003: 'Spanish La Liga',
            9005: 'UEFA Champions League',
            9006: 'National Basketball Association',
        };
        return leagueMap[leagueId];
    }),
}));

// Mock bytes32 module
jest.mock('bytes32', () => {
    return jest.fn((options: { input: string }) => {
        // Simple mock that converts string to a padded format
        const paddedString = options.input.padEnd(32, '\0');
        return paddedString;
    });
});

describe('OpticOdds Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('formatOpticOddsLeagueName', () => {
        it('should convert spaces to underscores and make lowercase', () => {
            expect(formatOpticOddsLeagueName('English Premier League')).toBe('english_premier_league');
            expect(formatOpticOddsLeagueName('UEFA Champions League')).toBe('uefa_champions_league');
            expect(formatOpticOddsLeagueName('German Bundesliga')).toBe('german_bundesliga');
        });

        it('should handle empty string', () => {
            expect(formatOpticOddsLeagueName('')).toBe('');
        });

        it('should handle single words', () => {
            expect(formatOpticOddsLeagueName('NBA')).toBe('nba');
        });
    });

    describe('mapFromOpticOddsToOvertimeFormat', () => {
        describe('when fixture ID does not contain separator', () => {
            it('should return the fixture ID unchanged', () => {
                const fixtureId = 'simple-fixture-id-123';
                const result = mapFromOpticOddsToOvertimeFormat(fixtureId);
                expect(result).toBe(fixtureId);
            });

            it('should return numeric fixture ID unchanged', () => {
                const fixtureId = '12345';
                const result = mapFromOpticOddsToOvertimeFormat(fixtureId);
                expect(result).toBe(fixtureId);
            });
        });

        describe('when fixture ID contains separator and league is mapped', () => {
            it('should convert Premier League fixture ID correctly', () => {
                const leagueName = formatOpticOddsLeagueName('English Premier League');
                const fixtureId = `${leagueName}${OPTIC_ODDS_ID_SEPARATOR}12345`;
                const result = mapFromOpticOddsToOvertimeFormat(fixtureId);
                expect(result).toBe(`9002${OVERTIME_ID_SEPARATOR}12345`);
            });

            it('should convert Bundesliga fixture ID correctly', () => {
                const leagueName = formatOpticOddsLeagueName('German Bundesliga');
                const fixtureId = `${leagueName}${OPTIC_ODDS_ID_SEPARATOR}67890`;
                const result = mapFromOpticOddsToOvertimeFormat(fixtureId);
                expect(result).toBe(`9001${OVERTIME_ID_SEPARATOR}67890`);
            });

            it('should convert Champions League fixture ID correctly', () => {
                const leagueName = formatOpticOddsLeagueName('UEFA Champions League');
                const fixtureId = `${leagueName}${OPTIC_ODDS_ID_SEPARATOR}match-001`;
                const result = mapFromOpticOddsToOvertimeFormat(fixtureId);
                expect(result).toBe(`9005${OVERTIME_ID_SEPARATOR}match-001`);
            });
        });

        describe('when fixture ID contains separator but league is not mapped', () => {
            it('should throw error for unmapped league name', () => {
                const unmappedLeague = 'unknown_league';
                const fixtureId = `${unmappedLeague}${OPTIC_ODDS_ID_SEPARATOR}12345`;
                
                expect(() => {
                    mapFromOpticOddsToOvertimeFormat(fixtureId);
                }).toThrow('Optic Odds league unknown_league not mapped.');
            });

            it('should throw error for empty league name', () => {
                const fixtureId = `${OPTIC_ODDS_ID_SEPARATOR}12345`;
                
                expect(() => {
                    mapFromOpticOddsToOvertimeFormat(fixtureId);
                }).toThrow('Optic Odds league  not mapped.');
            });
        });
    });

    describe('mapFromOvertimeToOpticOddsFormat', () => {
        describe('when game ID does not contain separator', () => {
            it('should return the game ID unchanged', () => {
                const gameId = 'simple-game-id-123';
                const result = mapFromOvertimeToOpticOddsFormat(gameId);
                expect(result).toBe(gameId);
            });

            it('should return numeric game ID unchanged', () => {
                const gameId = '12345';
                const result = mapFromOvertimeToOpticOddsFormat(gameId);
                expect(result).toBe(gameId);
            });
        });

        describe('when game ID contains separator and league is mapped', () => {
            it('should convert Premier League game ID correctly', () => {
                const gameId = `9002${OVERTIME_ID_SEPARATOR}12345`;
                const result = mapFromOvertimeToOpticOddsFormat(gameId);
                const expectedLeagueName = formatOpticOddsLeagueName('English Premier League');
                expect(result).toBe(`${expectedLeagueName}${OPTIC_ODDS_ID_SEPARATOR}12345`);
            });

            it('should convert Bundesliga game ID correctly', () => {
                const gameId = `9001${OVERTIME_ID_SEPARATOR}67890`;
                const result = mapFromOvertimeToOpticOddsFormat(gameId);
                const expectedLeagueName = formatOpticOddsLeagueName('German Bundesliga');
                expect(result).toBe(`${expectedLeagueName}${OPTIC_ODDS_ID_SEPARATOR}67890`);
            });

            it('should convert Champions League game ID correctly', () => {
                const gameId = `9005${OVERTIME_ID_SEPARATOR}match-001`;
                const result = mapFromOvertimeToOpticOddsFormat(gameId);
                const expectedLeagueName = formatOpticOddsLeagueName('UEFA Champions League');
                expect(result).toBe(`${expectedLeagueName}${OPTIC_ODDS_ID_SEPARATOR}match-001`);
            });
        });

        describe('when game ID contains separator but league is not mapped', () => {
            it('should throw error for unmapped league ID', () => {
                const gameId = `9999${OVERTIME_ID_SEPARATOR}12345`;
                
                expect(() => {
                    mapFromOvertimeToOpticOddsFormat(gameId);
                }).toThrow('Overtime league ID 9999 not mapped.');
            });

            it('should throw error for invalid league ID', () => {
                const gameId = `invalid${OVERTIME_ID_SEPARATOR}12345`;
                
                expect(() => {
                    mapFromOvertimeToOpticOddsFormat(gameId);
                }).toThrow('Overtime league ID invalid not mapped.');
            });
        });
    });

    describe('convertFromBytes32', () => {
        it('should remove null characters from bytes32 string', () => {
            const input = 'test\0\0\0\0';
            const result = convertFromBytes32(input);
            expect(result).toBe('test');
        });

        it('should handle string without null characters', () => {
            const input = 'teststring';
            const result = convertFromBytes32(input);
            expect(result).toBe('teststring');
        });

        it('should handle empty string', () => {
            const input = '';
            const result = convertFromBytes32(input);
            expect(result).toBe('');
        });
    });

    describe('mapFromOpticOddsFormatToBytes32', () => {
        it('should convert optic odds format to bytes32', () => {
            const leagueName = formatOpticOddsLeagueName('English Premier League');
            const fixtureId = `${leagueName}${OPTIC_ODDS_ID_SEPARATOR}12345`;
            const result = mapFromOpticOddsFormatToBytes32(fixtureId);
            
            // Should first convert to overtime format, then to bytes32
            const expectedOvertimeFormat = `9002${OVERTIME_ID_SEPARATOR}12345`;
            const expectedBytes32 = expectedOvertimeFormat.padEnd(32, '\0');
            expect(result).toBe(expectedBytes32);
        });

        it('should handle fixture ID without separator', () => {
            const fixtureId = '12345';
            const result = mapFromOpticOddsFormatToBytes32(fixtureId);
            
            const expectedBytes32 = fixtureId.padEnd(32, '\0');
            expect(result).toBe(expectedBytes32);
        });
    });

    describe('mapFromBytes32ToOpticOddsFormat', () => {
        it('should convert bytes32 to optic odds format', () => {
            const overtimeFormat = `9002${OVERTIME_ID_SEPARATOR}12345`;
            const bytes32Input = overtimeFormat.padEnd(32, '\0');
            const result = mapFromBytes32ToOpticOddsFormat(bytes32Input);
            
            const expectedLeagueName = formatOpticOddsLeagueName('English Premier League');
            const expectedResult = `${expectedLeagueName}${OPTIC_ODDS_ID_SEPARATOR}12345`;
            expect(result).toBe(expectedResult);
        });

        it('should handle bytes32 without separator', () => {
            const gameId = '12345';
            const bytes32Input = gameId.padEnd(32, '\0');
            const result = mapFromBytes32ToOpticOddsFormat(bytes32Input);
            
            expect(result).toBe(gameId);
        });
    });

    describe('integration tests', () => {
        it('should convert from optic odds to bytes32 and back', () => {
            const leagueName = formatOpticOddsLeagueName('English Premier League');
            const originalFixtureId = `${leagueName}${OPTIC_ODDS_ID_SEPARATOR}12345`;
            
            // Convert to bytes32
            const bytes32Result = mapFromOpticOddsFormatToBytes32(originalFixtureId);
            
            // Convert back to optic odds format
            const backToOpticOdds = mapFromBytes32ToOpticOddsFormat(bytes32Result);
            
            expect(backToOpticOdds).toBe(originalFixtureId);
        });

        it('should convert between optic odds and overtime formats', () => {
            const leagueName = formatOpticOddsLeagueName('German Bundesliga');
            const opticOddsId = `${leagueName}${OPTIC_ODDS_ID_SEPARATOR}67890`;
            
            // Convert to overtime format
            const overtimeFormat = mapFromOpticOddsToOvertimeFormat(opticOddsId);
            expect(overtimeFormat).toBe(`9001${OVERTIME_ID_SEPARATOR}67890`);
            
            // Convert back to optic odds format
            const backToOpticOdds = mapFromOvertimeToOpticOddsFormat(overtimeFormat);
            expect(backToOpticOdds).toBe(opticOddsId);
        });

        it('should handle round trip conversion with NBA league', () => {
            const leagueName = formatOpticOddsLeagueName('National Basketball Association');
            const originalId = `${leagueName}${OPTIC_ODDS_ID_SEPARATOR}game-456`;
            
            // Optic Odds -> Overtime -> Optic Odds
            const overtimeFormat = mapFromOpticOddsToOvertimeFormat(originalId);
            const backToOpticOdds = mapFromOvertimeToOpticOddsFormat(overtimeFormat);
            
            expect(backToOpticOdds).toBe(originalId);
        });
    });
});
