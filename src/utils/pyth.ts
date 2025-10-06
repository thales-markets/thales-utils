import { TEST_NETWORKS } from '../constants/network';
import {
    BENCHMARKS_PRICE_ENDPOINT,
    PRICE_ID,
    PRICE_SERVICE_ENDPOINTS,
    PRICE_UPDATES_PATH,
    PYTH_API_RETRIES,
    PYTH_API_TIMEOUT_MS,
} from '../constants/pyth';
import { SPEED_MARKETS_SUPPORTED_ASSETS } from '../constants/speedMarkets';
import { NetworkId } from '../enums/network';
import { AssetsPrices } from '../types/prices';
import { priceNumberFormatter } from './speedMarkets';

const getPriceServiceEndpoint = (networkId: NetworkId) => {
    if (TEST_NETWORKS.includes(networkId)) {
        return PRICE_SERVICE_ENDPOINTS.testnet;
    } else {
        return PRICE_SERVICE_ENDPOINTS.mainnet;
    }
};

export const getPriceId = (networkId: NetworkId, currency: string) => {
    if (TEST_NETWORKS.includes(networkId)) {
        return PRICE_ID.testnet[currency];
    } else {
        return PRICE_ID.mainnet[currency];
    }
};

const getCurrencyByPriceId = (networkId: NetworkId, priceId: string) => {
    if (TEST_NETWORKS.includes(networkId)) {
        return (
            Object.keys(PRICE_ID.testnet).find((key) => PRICE_ID.testnet[key] === '0x' + priceId) || 'currencyNotFound'
        );
    } else {
        return (
            Object.keys(PRICE_ID.mainnet).find((key) => PRICE_ID.mainnet[key] === '0x' + priceId) || 'currencyNotFound'
        );
    }
};

export const getSupportedAssetsAsObject = (): AssetsPrices =>
    SPEED_MARKETS_SUPPORTED_ASSETS.reduce((acc, asset) => ({ ...acc, [asset]: 0 }), {});

// HermesClient code with retries and timeout
const httpRequest = async (
    url: RequestInfo,
    options?: RequestInit,
    retries = PYTH_API_RETRIES,
    backoff = 100 + Math.floor(Math.random() * 100) // Adding randomness to the initial backoff to avoid "thundering herd" scenario where a lot of clients that get kicked off all at the same time (say some script or something) and fail to connect all retry at exactly the same time too
) => {
    const controller = new AbortController();
    const { signal } = controller;
    options = { ...options, signal }; // Merge any existing options with the signal
    // Set a timeout to abort the request if it takes too long
    const timeout = setTimeout(() => controller.abort(), PYTH_API_TIMEOUT_MS);
    try {
        const response = await fetch(url, options);
        clearTimeout(timeout); // Clear the timeout if the request completes in time
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        clearTimeout(timeout);
        if (retries > 0 && !(error instanceof Error && error.name === 'AbortError')) {
            // Wait for a backoff period before retrying
            await new Promise((resolve) => setTimeout(resolve, backoff));
            return httpRequest(url, options, retries - 1, backoff * 2); // Exponential backoff
        }
        throw error;
    }
};

export const getCurrentPrices = async (networkId: NetworkId, priceIds: string[]) => {
    let currentPrices = getSupportedAssetsAsObject();

    const host = getPriceServiceEndpoint(networkId);
    const queryParams = `?ids[]=${priceIds.join('&ids[]=')}`;
    const fullPath = `${PRICE_UPDATES_PATH}latest${queryParams}`;
    const url = `${host}${fullPath}`;

    try {
        const response = await httpRequest(url);

        if (!response.parsed) {
            console.error(`Missing parsed object from Pyth latest price feeds API: ${url}`);
            return currentPrices;
        }

        currentPrices = response.parsed.reduce(
            (accumulator: AssetsPrices, priceFeed: any) => ({
                ...accumulator,
                [getCurrencyByPriceId(networkId, priceFeed.id)]: priceNumberFormatter(priceFeed.price.price),
            }),
            {}
        );
    } catch (e) {
        console.error(`Error while fetching Pyth latest price feeds (${url})`, e);
    }

    return currentPrices;
};

export const getPricesAtTimestamp = async (networkId: NetworkId, priceIds: string[], timestamp: number) => {
    const host = getPriceServiceEndpoint(networkId);
    const queryParams = `?ids[]=${priceIds.join('&ids[]=')}`;
    const fullPath = `${PRICE_UPDATES_PATH}${timestamp}${queryParams}`;
    const url = `${host}${fullPath}`;

    try {
        const response = await httpRequest(url);

        return response;
    } catch (e) {
        console.error(`Error while fetching Pyth price feeds at timestamp (${url})`, e);
    }

    return {};
};

/*
 * Fetching historical prices for a given array of objects with price ID and publish time
 * using Pyth benchmarks API.
 *
 * Pyth benchmarks API - for given price ID and publish time returns single historical price
 * as object 'parsed' with array of prices which contains parsed object with id and price data.
 *
 * Parametar Price ID is without starting chars 0x
 * Has limitations of 30 requests per 10 seconds.
 */
export const getBenchmarksPriceFeeds = async (priceFeeds: { priceId: string; publishTime: number }[]) => {
    const benchmarksPriceFeeds: { priceId: string; publishTime: number; price: number }[] = [];

    if (priceFeeds.length) {
        const benchmarksPricePromises = priceFeeds.map((data: any) =>
            fetch(`${BENCHMARKS_PRICE_ENDPOINT}${data.publishTime}?ids=${data.priceId}`).catch((e) =>
                console.log('Pyth price benchmarks error', e)
            )
        );

        const benchmarksPriceResponses = await Promise.allSettled(benchmarksPricePromises);
        const benchmarksResponseBodies: (Promise<any> | undefined)[] = benchmarksPriceResponses.map(
            (benchmarksPriceResponse) => {
                if (benchmarksPriceResponse.status === 'fulfilled') {
                    if (benchmarksPriceResponse.value) {
                        if (benchmarksPriceResponse.value.status == 200) {
                            return benchmarksPriceResponse.value.text();
                        } else {
                            console.log('Failed to fetch Pyth benchmarks data', benchmarksPriceResponse.value.status);
                        }
                    }
                }
            }
        );

        const responses = await Promise.all(benchmarksResponseBodies);
        responses.map((response, index) => {
            // parsed[0] - always fetching one price ID
            const bodyTextParsed = response ? JSON.parse(response).parsed[0] : undefined;

            benchmarksPriceFeeds.push({
                priceId: priceFeeds[index].priceId,
                publishTime: priceFeeds[index].publishTime, // requested publish time
                price: bodyTextParsed ? priceNumberFormatter(bodyTextParsed.price.price) : 0,
            });
        });
    }

    return benchmarksPriceFeeds;
};
