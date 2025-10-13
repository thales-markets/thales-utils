import { DATA_STREAMS_ENDPOINTS, DATA_STREAMS_PATHS, FEED_ID } from '../constants/chainlink';
import { COLLATERAL_DECIMALS, OTHER_COLLATERAL_DECIMALS } from '../constants/currency';
import { TEST_NETWORKS } from '../constants/network';
import { SPEED_MARKETS_PRICE_DECIMALS } from '../constants/speedMarkets';
import { NetworkId } from '../enums/network';
import { ParsedFullReport, SingleReport, SingleReportResponse } from '../types/chainlink';
import { Coins } from '../types/tokens';
import { bigNumberFormatter } from './formatters/viem';

/** Convert string to Uint8Array */
const toUint8Array = (data: string): Uint8Array => {
    return new TextEncoder().encode(data);
};

/** Convert ArrayBuffer to hex string */
const bufferToHex = (buffer: ArrayBuffer): string => {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
};

/** Generate SHA-256 hash */
const sha256 = async (data: string | ArrayBuffer): Promise<string> => {
    let buffer: ArrayBuffer;

    if (typeof data === 'string') {
        buffer = toUint8Array(data).buffer as ArrayBuffer;
    } else {
        buffer = data as ArrayBuffer;
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return bufferToHex(hashBuffer);
};

/** Generate HMAC-SHA256 */
const hmacSha256 = async (key: string, message: string): Promise<string> => {
    const keyData = toUint8Array(key);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData.buffer as ArrayBuffer,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const messageData = toUint8Array(message);
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData.buffer as ArrayBuffer);

    return bufferToHex(signatureBuffer);
};

/** Generate HMAC for API authentication */
const generateHMAC = async (
    method: string,
    path: string,
    body: string,
    apiKey: string,
    apiSecret: string
): Promise<{ signature: string; timestamp: number }> => {
    const timestamp = Date.now();
    const bodyHash = await sha256(body);

    const stringToSign = `${method} ${path} ${bodyHash} ${apiKey} ${timestamp}`;
    const signature = await hmacSha256(apiSecret, stringToSign);

    return { signature, timestamp };
};

const generateAuthHeaders = async (
    method: string,
    path: string,
    apiKey: string,
    apiSecret: string
): Promise<Record<string, string>> => {
    const { signature, timestamp } = await generateHMAC(method, path, '', apiKey, apiSecret);

    return {
        Authorization: apiKey,
        'X-Authorization-Timestamp': timestamp.toString(),
        'X-Authorization-Signature-SHA256': signature,
    };
};

const getDataStreamEndpoint = (networkId: NetworkId) => {
    if (TEST_NETWORKS.includes(networkId)) {
        return DATA_STREAMS_ENDPOINTS.testnet;
    } else {
        return DATA_STREAMS_ENDPOINTS.mainnet;
    }
};

export const fetchSingleReport = async (
    apiKey: string,
    apiSecret: string,
    networkId: NetworkId,
    feedID: string,
    timestamp?: number
): Promise<SingleReport> => {
    if (!apiKey || !apiSecret) {
        console.error('Chainlink API credentials not set.');
    }

    const method = 'GET';
    const host = getDataStreamEndpoint(networkId);
    const path = timestamp ? DATA_STREAMS_PATHS.reports : DATA_STREAMS_PATHS.latest;
    const fullPath = `${path}?feedID=${feedID}${timestamp ? `&timestamp=${timestamp}` : ''}`;
    const url = `${host}${fullPath}`;

    const headers = await generateAuthHeaders(method, fullPath, apiKey, apiSecret);
    const response = await fetch(url, { method, headers });

    if (!response.ok) {
        const text = await response.text();
        console.error(`Chainlink API (${url}) error (status ${response.status}): ${text}`);
        return {
            feedID,
            validFromTimestamp: timestamp || 0,
            observationsTimestamp: timestamp || 0,
            fullReport: '',
        };
    }

    const data = (await response.json()) as SingleReportResponse;
    return data.report;
};

export const getFeedId = (networkId: NetworkId, asset: string) => {
    if (TEST_NETWORKS.includes(networkId)) {
        return FEED_ID.testnet[asset];
    } else {
        return FEED_ID.mainnet[asset];
    }
};

export const getAssetByFeedId = (networkId: NetworkId, feedID: string) => {
    if (TEST_NETWORKS.includes(networkId)) {
        return Object.keys(FEED_ID.testnet).find((key) => FEED_ID.testnet[key] === feedID) || 'assetNotFound';
    } else {
        return Object.keys(FEED_ID.mainnet).find((key) => FEED_ID.mainnet[key] === feedID) || 'assetNotFound';
    }
};

export const parseChainlinkFullReport = (networkId: NetworkId, fullReport: string): ParsedFullReport => {
    if (fullReport.startsWith('0x')) {
        fullReport = fullReport.slice(2);
    }

    let offset = 256 * 2; // Skip context header first 256 bytes

    const readBytesAsHex = (length: number) => {
        const result = fullReport.slice(offset, offset + length * 2);
        offset += length * 2;
        return '0x' + result;
    };

    const feedID = readBytesAsHex(32);
    const asset = getAssetByFeedId(networkId, feedID) as Coins;
    const assetDecimals = COLLATERAL_DECIMALS[asset];

    const parseTimestamp = () => Number(BigInt(readBytesAsHex(32)));
    const parseFees = () => BigInt(readBytesAsHex(32));
    const parsePrice = () => bigNumberFormatter(BigInt(readBytesAsHex(32)), assetDecimals);

    // Order of parse commands are important!
    const validFromTimestamp = parseTimestamp();
    const observationsTimestamp = parseTimestamp();
    const nativeFee = parseFees();
    const linkFee = parseFees();
    const expiresAt = parseTimestamp();
    const price = parsePrice();
    const bid = parsePrice();
    const ask = parsePrice();

    return {
        feedID,
        validFromTimestamp,
        observationsTimestamp,
        nativeFee,
        nativeFeeDec: bigNumberFormatter(nativeFee, COLLATERAL_DECIMALS.WETH), // WETH is native token for OP, Arb and Base (Polygon should return 0)
        linkFee,
        linkFeeDec: bigNumberFormatter(linkFee, OTHER_COLLATERAL_DECIMALS.LINK),
        expiresAt,
        price,
        bid,
        ask,
    };
};

export const normalizeCandlestickPrice = (price: number, asset: string) =>
    Number((price / 10 ** OTHER_COLLATERAL_DECIMALS[asset]).toFixed(SPEED_MARKETS_PRICE_DECIMALS));
