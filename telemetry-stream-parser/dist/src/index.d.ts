export type TelemetryMetric = string;
export type TelemetryEvent = {
    timestamp: number;
    metric: TelemetryMetric;
    value: number | string | boolean | null;
    unit?: string;
    source?: string;
    index?: number;
};
export type ParseOptions = {
    maxInputBytes?: number;
    selectedMessages?: string[];
};
export declare function parseFile(buffer: Buffer | Uint8Array | ArrayBuffer, _options?: ParseOptions): AsyncGenerator<TelemetryEvent>;
