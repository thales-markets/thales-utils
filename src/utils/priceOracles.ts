import { NetworkId } from '../enums/network';
import { OracleSource } from '../enums/priceOracles';
import { AssetPriceDataAtTimestamp } from '../types/prices';
import { fetchSingleReport, getAssetByFeedId, getFeedId, parseChainlinkFullReport } from './chainlink';
import { getCurrentPrices, getPriceId, getPricesAtTimestamp, getSupportedAssetsAsObject } from './pyth';
import { priceNumberFormatter } from './speedMarkets';

export const getCurrentPricesFromOracle = async (
    oracle: OracleSource,
    networkId: NetworkId,
    assets: string[],
    apiKey: string,
    apiSecret: string
) => {
    let prices = getSupportedAssetsAsObject();

    switch (oracle) {
        case OracleSource.Pyth:
            const priceIds = assets.map((asset) => getPriceId(networkId, asset));
            prices = await getCurrentPrices(networkId, priceIds);
            break;
        case OracleSource.Chainlink:
            const feedIds = assets.map((asset) => getFeedId(networkId, asset));
            const promises = feedIds.map((feedId) => fetchSingleReport(apiKey, apiSecret, networkId, feedId));
            const reports = await Promise.all(promises);
            for (let i = 0; i < feedIds.length; i++) {
                const feedId = feedIds[i];
                const report = reports[i];
                const parsedReport = parseChainlinkFullReport(networkId, report.fullReport);
                const asset = getAssetByFeedId(networkId, feedId);
                prices[asset] = parsedReport.price;
            }
            break;
    }

    return prices;
};

export const getPriceDataAtTimestampFromOracle = async (
    oracle: OracleSource,
    networkId: NetworkId,
    asset: string,
    timestampSec: number,
    apiKey: string,
    apiSecret: string
) => {
    let priceData: AssetPriceDataAtTimestamp = {
        priceUpdateData: [],
        price: 0,
        timestamp: 0,
        nativeFee: BigInt(0),
    };

    switch (oracle) {
        case OracleSource.Pyth:
            const priceId = getPriceId(networkId, asset);
            const pythPriceData = await getPricesAtTimestamp(networkId, [priceId], timestampSec);
            priceData.priceUpdateData = pythPriceData.binary.data.map((vaa: string) => '0x' + vaa);
            if (pythPriceData.parsed) {
                priceData.price = priceNumberFormatter(pythPriceData.parsed[0].price.price);
                priceData.timestamp = pythPriceData.parsed[0].price.publish_time;
            }
            break;
        case OracleSource.Chainlink:
            const feedId = getFeedId(networkId, asset);
            const report = await fetchSingleReport(apiKey, apiSecret, networkId, feedId, timestampSec);
            const parsedReport = parseChainlinkFullReport(networkId, report.fullReport);
            priceData = {
                priceUpdateData: [report.fullReport],
                price: parsedReport.price,
                timestamp: parsedReport.validFromTimestamp,
                nativeFee: parsedReport.nativeFee,
            };
            break;
    }

    return priceData;
};
