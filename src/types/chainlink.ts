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
    nativeFee: number;
    linkFee: number;
    expiresAt: number;
    price: number;
    bid: number;
    ask: number;
};
