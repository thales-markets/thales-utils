import { ConfigItemType } from '../enums/speedMarkets';

export type ConfigItem = {
    type: ConfigItemType;
    day: string;
    from: string;
    to: string;
    networks: number[];
    value: string | string[];
    defaultValue: string | string[];
};

export type DeltaTimeChange = {
    nextChangeTime: Date;
    deltaTime: number;
};
