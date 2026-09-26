export type TelemetryMetric = string

export type TelemetryEvent = {
  timestamp: number
  metric: TelemetryMetric
  value: number | string | boolean | null
  unit?: string
  source?: string
  index?: number
}

export type ParseOptions = {
  maxInputBytes?: number
  selectedMessages?: string[]
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const normalizeTimestamp = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return Date.now()
}

const isPrimitive = (value: unknown): value is number | string | boolean | null => {
  return typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' || value === null
}

export async function* parseFile(
  buffer: Buffer | Uint8Array | ArrayBuffer,
  _options: ParseOptions = {},
): AsyncGenerator<TelemetryEvent> {
  let input: ArrayBuffer

  if (Buffer.isBuffer(buffer)) {
    input = Buffer.from(buffer).buffer.slice(
      Buffer.from(buffer).byteOffset,
      Buffer.from(buffer).byteOffset + Buffer.from(buffer).byteLength,
    ) as ArrayBuffer
  } else if (buffer instanceof Uint8Array) {
    input = new Uint8Array(buffer).buffer.slice(
      new Uint8Array(buffer).byteOffset,
      new Uint8Array(buffer).byteOffset + new Uint8Array(buffer).byteLength,
    ) as ArrayBuffer
  } else if (buffer instanceof ArrayBuffer) {
    input = buffer
  } else {
    throw new TypeError('parseFile requires a Buffer, Uint8Array, or ArrayBuffer.')
  }

  if (input.byteLength === 0) return

  const FitParserModule = await import('fit-file-parser')
  const FitParser = FitParserModule.default ?? FitParserModule
  const parser = new FitParser({ force: true, mode: 'list' })
  const data = await parser.parseAsync(input)
  const records = Array.isArray(data?.records) ? data.records : []

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index]
    if (!record || typeof record !== 'object') continue

    const timestampSource = (record as Record<string, unknown>).timestamp
    const timestamp = normalizeTimestamp(timestampSource)
    const entries = Object.entries(record as Record<string, unknown>)

    for (const [metric, rawValue] of entries) {
      if (metric === 'timestamp') continue
      if (rawValue === undefined || rawValue === null) continue
      if (typeof rawValue === 'object') continue

      const value: number | string | boolean | null =
        typeof rawValue === 'number' || typeof rawValue === 'string' || typeof rawValue === 'boolean' || rawValue === null
          ? rawValue
          : null

      yield {
        timestamp,
        metric,
        value,
        source: 'FIT',
        index,
      }
    }
  }
}
