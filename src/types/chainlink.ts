export type SingleReport = {
    feedID: string;
    validFromTimestamp: number;
    observationsTimestamp: number;
    fullReport: string;
};

export type SingleReportResponse = {
    report: SingleReport;
};

export type ParsedFullReport = {
    feedID: string;
    validFromTimestamp: number;
    observationsTimestamp: number;
    nativeFee: bigint;
    nativeFeeDec: number;
    linkFee: bigint;
    linkFeeDec: number;
    expiresAt: number;
    price: number;
    bid: number;
    ask: number;
};
