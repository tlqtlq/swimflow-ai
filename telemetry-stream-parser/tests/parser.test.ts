import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parseFile } from '../src/index.js'

const samplePath = path.join(process.cwd(), 'sample.fit')

const readEvents = async (buffer: Uint8Array) => {
  const yielded: unknown[] = []
  for await (const event of parseFile(buffer)) {
    yielded.push(event)
  }
  return yielded
}

test('parses a valid Garmin FIT file end to end', async () => {
  const sample = await readFile(samplePath)
  const events = await readEvents(new Uint8Array(sample))
  assert.ok(events.length > 0)
  assert.ok(events.some((event) => (event as any).metric === 'distance'))
  assert.ok(events.some((event) => (event as any).metric === 'heart_rate'))
  assert.ok(events.every((event) => typeof (event as any).timestamp === 'number'))
})

test('throws a graceful error for truncated FIT data', async () => {
  const sample = await readFile(samplePath)
  const truncated = new Uint8Array(sample.subarray(0, sample.length - 32))

  await assert.rejects(async () => {
    for await (const _event of parseFile(truncated)) {
      void _event
    }
  }, /invalid|truncated|too short|header|input length|exceeds input length/i)
})

test('handles an empty file without crashing', async () => {
  const events = await readEvents(new Uint8Array())
  assert.deepEqual(events, [])
})
