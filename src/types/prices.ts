export type AssetsPrices = { [key: string]: number };

export type AssetPriceDataAtTimestamp = {
    priceUpdateData: string[];
    price: number;
    timestamp: number;
    nativeFee: number;
};
