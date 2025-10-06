import { NetworkId } from '../enums/network';
import { OracleSource } from '../enums/priceOracles';
import { AssetPriceDataAtTimestamp } from '../types/prices';
import { fetchSingleReport, getAssetByFeedId, parseChainlinkFullReport } from './chainlink';
import { getCurrentPrices, getPricesAtTimestamp, getSupportedAssetsAsObject } from './pyth';
import { priceNumberFormatter } from './speedMarkets';

export const getCurrentPricesFromOracle = async (
    oracle: OracleSource,
    networkId: NetworkId,
    priceIds: string[],
    apiKey: string,
    apiSecret: string
) => {
    let prices = getSupportedAssetsAsObject();

    switch (oracle) {
        case OracleSource.Pyth:
            prices = await getCurrentPrices(networkId, priceIds);
            break;
        case OracleSource.Chainlink:
            const promises = priceIds.map((priceId) => fetchSingleReport(apiKey, apiSecret, networkId, priceId));
            const reports = await Promise.all(promises);
            for (let i = 0; i < priceIds.length; i++) {
                const priceId = priceIds[i];
                const report = reports[i];
                const parsedReport = parseChainlinkFullReport(networkId, report.fullReport);
                const asset = getAssetByFeedId(networkId, priceId);
                prices[asset] = parsedReport.price;
            }
            break;
    }

    return prices;
};

export const getPriceDataAtTimestampFromOracle = async (
    oracle: OracleSource,
    networkId: NetworkId,
    priceId: string,
    timestampSec: number,
    apiKey: string,
    apiSecret: string
) => {
    let priceData: AssetPriceDataAtTimestamp = {
        priceUpdateData: '',
        price: 0,
        timestamp: timestampSec,
    };

    switch (oracle) {
        case OracleSource.Pyth:
            const pythPriceData = await getPricesAtTimestamp(networkId, [priceId], timestampSec);
            priceData.priceUpdateData = pythPriceData.binary.data.map((vaa: string) => '0x' + vaa);
            if (pythPriceData.parsed) {
                priceData.price = priceNumberFormatter(pythPriceData.parsed[0].price.price);
                priceData.timestamp = pythPriceData.parsed[0].price.publish_time;
            }
            break;
        case OracleSource.Chainlink:
            const report = await fetchSingleReport(apiKey, apiSecret, networkId, priceId, timestampSec);
            const parsedReport = parseChainlinkFullReport(networkId, report.fullReport);
            priceData = {
                priceUpdateData: report.fullReport,
                price: parsedReport.price,
                timestamp: parsedReport.validFromTimestamp,
            };
            break;
    }

    return priceData;
};
