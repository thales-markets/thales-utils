import { ConfigItemType } from '../enums/speedMarkets';

export type ConfigItem = {
    type: ConfigItemType;
    day: string;
    from: string;
    to: string;
    networks: number[];
    value: string;
    defaultValue: string;
};

export type DeltaTimeChange = {
    nextChangeTime: Date;
    deltaTime: number;
};
