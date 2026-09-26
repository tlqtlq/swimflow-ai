const FIT_HEADER_SIZE = 12;
const FIT_MAX_MESSAGE_TYPES = 16;
const FIT_BASE_TYPES = {
    0: { size: 1, name: 'enum' },
    1: { size: 1, name: 'sint8' },
    2: { size: 1, name: 'uint8' },
    3: { size: 2, name: 'sint16' },
    4: { size: 2, name: 'uint16' },
    5: { size: 4, name: 'sint32' },
    6: { size: 4, name: 'uint32' },
    7: { size: 1, name: 'string' },
    8: { size: 4, name: 'float32' },
    9: { size: 8, name: 'float64' },
    10: { size: 1, name: 'uint8z' },
    11: { size: 2, name: 'uint16z' },
    12: { size: 4, name: 'uint32z' },
    13: { size: 1, name: 'byte' },
    14: { size: 2, name: 'sint16z' },
    15: { size: 4, name: 'sint32z' },
    16: { size: 4, name: 'float64' },
};
const FIT_FIELD_NAMES = {
    0: 'message_index',
    1: 'device_index',
    2: 'device_type',
    3: 'manufacturer',
    4: 'serial_number',
    5: 'product',
    6: 'time_created',
    7: 'timestamp',
    8: 'distance',
    9: 'speed',
    10: 'heart_rate',
    11: 'cadence',
    12: 'power',
    13: 'altitude',
    14: 'temperature',
    15: 'position_lat',
    16: 'position_long',
    17: 'elapsed_time',
    18: 'total_distance',
    19: 'start_time',
    20: 'activity_type',
    21: 'event',
    22: 'event_type',
    23: 'workout_step',
    24: 'lap_index',
    25: 'stroke_count',
    26: 'stroke_type',
    27: 'pool_length',
    28: 'swim_stroke',
    29: 'length_type',
    30: 'total_strokes',
    253: 'timestamp',
};
const FIT_MESSAGE_NAMES = {
    0: 'file_id',
    1: 'capabilities',
    2: 'device_settings',
    3: 'user_profile',
    4: 'hrm_profile',
    5: 'sdm_profile',
    6: 'bike_profile',
    7: 'zones_target',
    8: 'hr_zone',
    9: 'power_zone',
    10: 'met_zone',
    12: 'sport',
    18: 'session',
    19: 'lap',
    20: 'record',
    21: 'event',
    23: 'workout',
    24: 'workout_step',
    26: 'weight_scale',
    27: 'course',
    28: 'course_point',
    29: 'segment_id',
    30: 'segment_leaderboard_entry',
    31: 'segment_point',
    32: 'segment_file',
    34: 'exercise_title',
    36: 'device_info',
};
const readU16 = (view, offset, littleEndian) => view.getUint16(offset, littleEndian);
const readU32 = (view, offset, littleEndian) => view.getUint32(offset, littleEndian);
const readS32 = (view, offset, littleEndian) => view.getInt32(offset, littleEndian);
const readU8 = (view, offset) => view.getUint8(offset);
function decodeBaseValue(view, offset, baseType, littleEndian) {
    const base = FIT_BASE_TYPES[baseType];
    if (!base)
        return null;
    switch (baseType) {
        case 1: return view.getInt8(offset);
        case 2: return view.getUint8(offset);
        case 3: return view.getInt16(offset, littleEndian);
        case 4: return view.getUint16(offset, littleEndian);
        case 5: return view.getInt32(offset, littleEndian);
        case 6: return view.getUint32(offset, littleEndian);
        case 8: return view.getFloat32(offset, littleEndian);
        case 9: return view.getFloat64(offset, littleEndian);
        case 10: return view.getUint8(offset) !== 0;
        case 11: return view.getUint16(offset, littleEndian);
        case 12: return view.getUint32(offset, littleEndian);
        case 14: return view.getInt16(offset, littleEndian);
        case 15: return view.getInt32(offset, littleEndian);
        default: return null;
    }
}
function messageNameFor(globalMessageNumber) {
    return FIT_MESSAGE_NAMES[globalMessageNumber] ?? `message_${globalMessageNumber}`;
}
function normalizeMetricName(fieldNumber, fallback) {
    return FIT_FIELD_NAMES[fieldNumber] ?? fallback;
}
function parseFitPayload(buffer) {
    if (buffer.length < FIT_HEADER_SIZE) {
        throw new Error('FIT payload is too short to contain a valid header.');
    }
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const headerSize = view.getUint8(0);
    if (headerSize !== 14 && headerSize !== 12) {
        throw new Error(`Unsupported FIT header size: ${headerSize}`);
    }
    const fileType = String.fromCharCode(view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (fileType !== 'FIT') {
        throw new Error('FIT payload does not begin with a valid FIT header.');
    }
    const protocolVersion = view.getUint8(4);
    const profileVersion = readU16(view, 5, true);
    const dataSize = readU32(view, 7, true);
    const dataOffset = FIT_HEADER_SIZE;
    if (dataOffset + dataSize > buffer.length) {
        throw new Error('FIT payload is truncated: data section exceeds the file size.');
    }
    const definitions = new Map();
    const messages = [];
    let cursor = dataOffset;
    let sequenceIndex = 0;
    while (cursor < buffer.length) {
        const recordHeader = readU8(view, cursor);
        cursor += 1;
        if (cursor > buffer.length) {
            throw new Error('FIT payload ended while parsing a record header.');
        }
        const isDefinitionMessage = (recordHeader & 0x40) !== 0;
        const localMessageType = recordHeader & 0x0f;
        if (isDefinitionMessage) {
            if (cursor + 5 > buffer.length) {
                throw new Error('FIT definition message is truncated.');
            }
            const reserved = readU8(view, cursor);
            const architecture = readU8(view, cursor + 1);
            const globalMessageNumber = readU16(view, cursor + 2, true);
            const fieldCount = readU8(view, cursor + 4);
            const littleEndian = architecture === 0;
            if (reserved !== 0) {
                throw new Error('Unsupported FIT definition reserved byte value.');
            }
            const definitionFields = [];
            let fieldCursor = cursor + 5;
            for (let fieldIndex = 0; fieldIndex < fieldCount; fieldIndex += 1) {
                if (fieldCursor + 3 > buffer.length) {
                    throw new Error('FIT field definition is truncated.');
                }
                const number = readU8(view, fieldCursor);
                const size = readU8(view, fieldCursor + 1);
                const baseType = readU8(view, fieldCursor + 2);
                definitionFields.push({ number, size, baseType });
                fieldCursor += 3;
            }
            definitions.set(localMessageType, {
                localMessageType,
                globalMessageNumber,
                fields: definitionFields,
            });
            cursor = fieldCursor;
            continue;
        }
        const definition = definitions.get(localMessageType);
        if (!definition) {
            throw new Error(`Encountered FIT data record for unknown local message type: ${localMessageType}`);
        }
        const messageName = messageNameFor(definition.globalMessageNumber);
        const values = {};
        let dataCursor = cursor;
        for (const field of definition.fields) {
            const base = FIT_BASE_TYPES[field.baseType];
            if (!base) {
                dataCursor += field.size;
                continue;
            }
            if (dataCursor + field.size > buffer.length) {
                throw new Error(`FIT data record is truncated for ${messageName}.`);
            }
            const value = decodeBaseValue(view, dataCursor, field.baseType, littleEndian = (definition.globalMessageNumber === 0 ? true : true));
            values[field.number] = value;
            dataCursor += field.size;
        }
        const baseTimestamp = values[253] ?? values[7] ?? values[6] ?? values[19] ?? null;
        const fallbackTimestamp = Math.max(0, Math.round((Date.now() - (protocolVersion * 1000)) / 1000));
        const eventTime = typeof baseTimestamp === 'number' ? baseTimestamp : fallbackTimestamp;
        for (const field of definition.fields) {
            const metricName = normalizeMetricName(field.number, `${messageName}.${field.number}`);
            const value = values[field.number];
            if (value === undefined || value === null)
                continue;
            messages.push({
                timestamp: eventTime,
                metric: metricName,
                value,
                source: messageName,
                index: sequenceIndex,
            });
            sequenceIndex += 1;
        }
        cursor = dataCursor;
    }
    return messages;
}
export async function* parseFile(buffer) {
    const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : Buffer.isBuffer(buffer) ? buffer : new Uint8Array(buffer);
    const events = parseFitPayload(bytes);
    for (const event of events) {
        yield event;
    }
}
