import * as oddslib from 'oddslib';

export const getBookmakersArray = (bookmakersData, sportId, backupLiveOddsProviders) => {
    const sportBookmakersData = bookmakersData.find((data) => Number(data.sportId) === Number(sportId));
    if (sportBookmakersData) {
        if (sportBookmakersData.primaryBookmaker == '') {
            return backupLiveOddsProviders;
        }
        const bookmakersArray: string[] = [];

        sportBookmakersData.primaryBookmaker ? bookmakersArray.push(sportBookmakersData.primaryBookmaker) : '';
        sportBookmakersData.secondaryBookmaker ? bookmakersArray.push(sportBookmakersData.secondaryBookmaker) : '';
        sportBookmakersData.tertiaryBookmaker ? bookmakersArray.push(sportBookmakersData.tertiaryBookmaker) : '';

        return bookmakersArray;
    }
    return backupLiveOddsProviders;
};

export const checkOddsFromBookmakers = (
    oddsMap: Map<string, any>,
    arrayOfBookmakers: string[],
    isTwoPositionalSport: boolean,
    maxImpliedPercentageDifference: number,
    minOddsForDiffChecking: number
) => {
    console.log('########## CHECK ODDS START ##########');
    console.log('oddsMap: ' + oddsMap);
    console.log('arrayOfBookmakers: ' + arrayOfBookmakers);
    console.log('isTwoPositionalSport: ' + isTwoPositionalSport);
    console.log('maxImpliedPercentageDifference: ' + maxImpliedPercentageDifference);
    console.log('minOddsForDiffChecking: ' + minOddsForDiffChecking);
    console.log('########## CHECK ODDS END ##########');
    // Check if any bookmaker has odds of 0 or 0.0001
    const hasZeroOrOne = arrayOfBookmakers.some((bookmakerId) => {
        const line = oddsMap.get(bookmakerId);
        if (line) {
            return (
                line.homeOdds === 0 ||
                line.awayOdds === 0 ||
                (!isTwoPositionalSport && line.drawOdds === 0) ||
                line.homeOdds === 1 ||
                line.awayOdds === 1 ||
                (!isTwoPositionalSport && line.drawOdds === 1)
            );
        }
        return false;
    });

    if (arrayOfBookmakers.length == 1) {
        if (hasZeroOrOne) {
            // If any bookmaker has zero odds, return zero odds
            return [
                {
                    homeOdds: 0,
                    awayOdds: 0,
                    drawOdds: 0,
                },
            ];
        }

        const firstBookmaker = arrayOfBookmakers[0];
        const firstLine = oddsMap.get(firstBookmaker);
        return [
            {
                homeOdds: firstLine.homeOdds,
                awayOdds: firstLine.awayOdds,
                drawOdds: isTwoPositionalSport ? 0 : firstLine.drawOdds,
            },
        ];
    }

    if (hasZeroOrOne) {
        // If any bookmaker has zero odds, return zero odds
        return [
            {
                homeOdds: 0,
                awayOdds: 0,
                drawOdds: 0,
            },
        ];
    } else {
        // Main bookmaker odds
        const firstBookmakerOdds = oddsMap.get(arrayOfBookmakers[0]);
        const homeOdd = firstBookmakerOdds.homeOdds;
        const awayOdd = firstBookmakerOdds.awayOdds;
        const drawOdd = firstBookmakerOdds.drawOdds;

        // If none of the bookmakers have zero odds, check implied odds percentage difference
        const hasLargeImpliedPercentageDifference = arrayOfBookmakers.slice(1).some((bookmakerId) => {
            const line = oddsMap[bookmakerId];
            if (line) {
                const otherHomeOdd = line.homeOdds;
                const otherAwayOdd = line.awayOdds;
                const otherDrawOdd = line.drawOdds;

                const homeOddsImplied = oddslib.from('decimal', homeOdd).to('impliedProbability');

                const awayOddsImplied = oddslib.from('decimal', awayOdd).to('impliedProbability');

                // Calculate implied odds for the "draw" if it's not a two-positions sport
                const drawOddsImplied = isTwoPositionalSport
                    ? 0
                    : oddslib.from('decimal', drawOdd).to('impliedProbability');

                const otherHomeOddImplied = oddslib.from('decimal', otherHomeOdd).to('impliedProbability');

                const otherAwayOddImplied = oddslib.from('decimal', otherAwayOdd).to('impliedProbability');

                // Calculate implied odds for the "draw" if it's not a two-positions sport
                const otherDrawOddImplied = isTwoPositionalSport
                    ? 0
                    : oddslib.from('decimal', otherDrawOdd).to('impliedProbability');

                // Calculate the percentage difference for implied odds
                const homeOddsDifference = calculateImpliedOddsDifference(homeOddsImplied, otherHomeOddImplied);

                const awayOddsDifference = calculateImpliedOddsDifference(awayOddsImplied, otherAwayOddImplied);

                // Check implied odds difference for the "draw" only if it's not a two-positions sport
                const drawOddsDifference = isTwoPositionalSport
                    ? 0
                    : calculateImpliedOddsDifference(drawOddsImplied, otherDrawOddImplied);

                // Check if the percentage difference exceeds the threshold
                if (
                    (homeOddsDifference > maxImpliedPercentageDifference &&
                        homeOddsImplied > minOddsForDiffChecking &&
                        otherHomeOddImplied > minOddsForDiffChecking) ||
                    (awayOddsDifference > maxImpliedPercentageDifference &&
                        awayOddsImplied > minOddsForDiffChecking &&
                        otherAwayOddImplied > minOddsForDiffChecking) ||
                    (!isTwoPositionalSport &&
                        drawOddsDifference > maxImpliedPercentageDifference &&
                        drawOddsImplied > minOddsForDiffChecking &&
                        otherDrawOddImplied > minOddsForDiffChecking)
                ) {
                    return true;
                }
            }
            return false;
        });

        if (hasLargeImpliedPercentageDifference) {
            console.log('Returning zero odds due to percentage difference');
            return [
                {
                    homeOdds: 0,
                    awayOdds: 0,
                    drawOdds: 0,
                },
            ];
        }

        let lines: any[] = [];
        arrayOfBookmakers.forEach((bookmaker) => lines.push(oddsMap.get(bookmaker)));

        if (lines[0] != undefined) {
            return lines.map((line) => {
                return {
                    homeOdds: line.homeOdds,
                    awayOdds: line.awayOdds,
                    drawOdds: isTwoPositionalSport ? 0 : line.drawOdds,
                };
            });
        }
    }

    // If no matching bookmakers are found, return zero odds
    console.log('Returning zero odds cause no matching bookmakers have been found');
    return [
        {
            homeOdds: 0,
            awayOdds: 0,
            drawOdds: 0,
        },
    ];
};

export const calculateImpliedOddsDifference = (impliedOddsA: number, impliedOddsB: number): number => {
    const percentageDifference = (Math.abs(impliedOddsA - impliedOddsB) / impliedOddsA) * 100;
    console.log('% diff: ' + percentageDifference);
    return percentageDifference;
};
