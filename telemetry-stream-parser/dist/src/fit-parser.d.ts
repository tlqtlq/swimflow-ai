export type TelemetryMetric = string;
export type TelemetryEvent = {
    timestamp: number;
    metric: TelemetryMetric;
    value: number | string | boolean | null;
    unit?: string;
    source?: string;
    index?: number;
};
export declare function parseFile(buffer: Buffer | Uint8Array | ArrayBuffer): AsyncGenerator<TelemetryEvent>;
