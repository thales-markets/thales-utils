export const findOddsForTeam = (liveOddsProviders, gameWithOdds, market, teamsMap, isDrawAvailable) => {
    const linesMap = new Map<any, any>();

    liveOddsProviders.forEach((oddsProvider) => {
        const providerOddsObjects = gameWithOdds.odds.filter(
            (oddsObject) => oddsObject.sports_book_name.toLowerCase() == oddsProvider.toLowerCase()
        );

        const gameHomeTeam = teamsMap.get(market.homeTeam.toLowerCase());
        const gameAwayTeam = teamsMap.get(market.awayTeam.toLowerCase());

        let homeOddsObject;
        if (gameHomeTeam == undefined) {
            homeOddsObject = providerOddsObjects.find((oddsObject) => {
                const opticOddsTeamName = teamsMap.get(oddsObject.name.toLowerCase());

                if (opticOddsTeamName == undefined) {
                    return oddsObject.name.toLowerCase() == market.homeTeam.toLowerCase();
                } else {
                    return opticOddsTeamName == market.homeTeam.toLowerCase();
                }
            });
        } else {
            homeOddsObject = providerOddsObjects.find((oddsObject) => {
                const opticOddsTeamName = teamsMap.get(oddsObject.name.toLowerCase());

                if (opticOddsTeamName == undefined) {
                    return oddsObject.name.toLowerCase() == gameHomeTeam;
                } else {
                    return opticOddsTeamName == gameHomeTeam;
                }
            });
        }

        let homeOdds = 0;
        if (homeOddsObject != undefined) {
            homeOdds = homeOddsObject.price;
        }

        let awayOddsObject;
        if (gameAwayTeam == undefined) {
            awayOddsObject = providerOddsObjects.find((oddsObject) => {
                const opticOddsTeamName = teamsMap.get(oddsObject.name.toLowerCase());

                if (opticOddsTeamName == undefined) {
                    return oddsObject.name.toLowerCase() == market.awayTeam.toLowerCase();
                } else {
                    return opticOddsTeamName == market.awayTeam.toLowerCase();
                }
            });
        } else {
            awayOddsObject = providerOddsObjects.find((oddsObject) => {
                const opticOddsTeamName = teamsMap.get(oddsObject.name.toLowerCase());

                if (opticOddsTeamName == undefined) {
                    return oddsObject.name.toLowerCase() == gameAwayTeam;
                } else {
                    return opticOddsTeamName == gameAwayTeam;
                }
            });
        }

        let awayOdds = 0;
        if (awayOddsObject != undefined) {
            awayOdds = awayOddsObject.price;
        }

        let drawOdds = 0;
        if (isDrawAvailable) {
            const drawOddsObject = providerOddsObjects.find((oddsObject) => oddsObject.name.toLowerCase() == 'draw');

            if (drawOddsObject != undefined) {
                drawOdds = drawOddsObject.price;
            }
        }

        linesMap.set(oddsProvider.toLowerCase(), {
            homeOdds: homeOdds,
            awayOdds: awayOdds,
            drawOdds: drawOdds,
        });
    });

    return linesMap;
};
