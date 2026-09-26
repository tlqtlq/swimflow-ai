import { Buffer } from 'node:buffer';
export function createSyntheticFitFile(recordCount = 128) {
    const header = Buffer.alloc(12);
    header[0] = 14;
    header[1] = 0x46;
    header[2] = 0x49;
    header[3] = 0x54;
    header[4] = 0x00;
    header[5] = 0x00;
    header[6] = 0x00;
    header[7] = 0x00;
    header[8] = 0x00;
    header[9] = 0x00;
    header[10] = 0x00;
    header[11] = 0x00;
    const records = [];
    const baseTime = 1_700_000_000;
    const definition = Buffer.from([
        0x40, 0x00, 0x00, 0x14, 0x05,
        0xfd, 0x04, 0x06,
        0x08, 0x04, 0x06,
        0x0a, 0x01, 0x02,
        0x0b, 0x01, 0x02,
        0x0c, 0x02, 0x04,
    ]);
    records.push(definition);
    for (let index = 0; index < recordCount; index += 1) {
        const ts = baseTime + index * 5;
        const distance = 25 + index * 10;
        const speed = 1_500 + (index % 8) * 120;
        const heartRate = 140 + (index % 18);
        const cadence = 82 + (index % 18);
        const power = 175 + (index % 25) * 3;
        const data = Buffer.alloc(18);
        let offset = 0;
        data[offset++] = 0x00;
        data.writeUInt32LE(ts, offset);
        offset += 4;
        data.writeUInt32LE(distance, offset);
        offset += 4;
        data.writeUInt16LE(speed, offset);
        offset += 2;
        data.writeUInt8(heartRate, offset++);
        data.writeUInt8(cadence, offset++);
        data.writeUInt16LE(power, offset);
        records.push(data);
    }
    const payload = Buffer.concat([header, ...records]);
    const finalBuffer = Buffer.alloc(payload.length + 4);
    payload.copy(finalBuffer, 0);
    finalBuffer.writeUInt32LE(0, payload.length);
    return finalBuffer;
}
