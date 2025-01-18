import { LeagueInfo } from '../types/sports';

export const adjustSpreadOnOdds = (impliedProbs, minSpread, targetSpread) => {
    // Step 1: Check if any implied probability is zero
    if (impliedProbs.some((prob) => prob === 0)) {
        return impliedProbs;
    }

    // Step 2: Calculate the current total implied probabilities
    const totalImpliedProbs = impliedProbs.reduce((sum, prob) => sum + prob, 0);

    // Step 3: Check if the sum of implied probabilities is greater than 1
    if (totalImpliedProbs <= 1) {
        return Array(impliedProbs.length).fill(0);
    }

    // Step 4: Check if targetSpread is zero
    if (targetSpread === 0) {
        const currentSpread = (totalImpliedProbs - 1) * 100;
        // If minSpread is set and greater than current spread, use minSpread
        if (minSpread > currentSpread) {
            targetSpread = minSpread;
        } else {
            // If minSpread is less than current spread, return odds as they are
            return impliedProbs;
        }
    }

    // Step 5: Calculate the target total implied probabilities
    const targetTotalImpliedProbs = 1 + targetSpread / 100;

    // Step 6: Calculate the adjustment factor
    const adjustmentFactor = targetTotalImpliedProbs / totalImpliedProbs;

    // Step 7: Adjust the probabilities to reflect the target spread
    let adjustedImpliedProbs = impliedProbs.map((prob) => prob * adjustmentFactor);

    // Step 8: Check if any adjusted probability equals or exceeds 1
    if (adjustedImpliedProbs.some((prob) => prob >= 1)) {
        return Array(impliedProbs.length).fill(0);
    }

    // Step 9: Ensure the sum of the adjusted probabilities equals the target total implied probabilities
    const sumAdjustedProbs = adjustedImpliedProbs.reduce((sum, prob) => sum + prob, 0);

    // Step 10: If the sum of the adjusted probabilities is less than 1, return zeros
    if (sumAdjustedProbs < 1) {
        return Array(impliedProbs.length).fill(0);
    }

    const normalizationFactor = targetTotalImpliedProbs / sumAdjustedProbs;
    adjustedImpliedProbs = adjustedImpliedProbs.map((prob) => prob * normalizationFactor);

    return adjustedImpliedProbs;
};

export const getSpreadData = (spreadData, sportId, typeId, defaultSpreadForLiveMarkets) => {
    const sportSpreadData = spreadData.find(
        (data) => Number(data.typeId) === Number(typeId) && Number(data.sportId) === Number(sportId)
    );
    if (sportSpreadData) {
        return {
            minSpread: sportSpreadData.minSpread ? Number(sportSpreadData.minSpread) : defaultSpreadForLiveMarkets,
            targetSpread: sportSpreadData.targetSpread ? Number(sportSpreadData.targetSpread) : 0,
        };
    }
    return { minSpread: defaultSpreadForLiveMarkets, targetSpread: 0 };
};

export const adjustAddedSpread = (odds: number[], leagueInfo: LeagueInfo[], typeId: number) => {
    // Pack market odds for UI
    return odds.map((probability) => {
        if (probability != 0) {
            const leagueInfoByTypeId = leagueInfo.find((league) => Number(league.typeId) === Number(typeId));
            let finalProbability = probability;

            if (probability < 0.95) {
                if (leagueInfoByTypeId && Number(leagueInfoByTypeId.addedSpread)) {
                    finalProbability = (probability * (100 + Number(leagueInfoByTypeId.addedSpread))) / 100;
                    // edge case if added spread is bigger than 5%, it can happen that odd goes above 1, in that case return odd from api.
                    if (finalProbability >= 1) {
                        finalProbability = probability;
                    }
                }
            }

            return finalProbability;
        } else {
            return 0;
        }
    });
};
