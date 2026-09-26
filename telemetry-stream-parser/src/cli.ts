#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { parseFile } from './index.js'

async function main() {
  const filePath = process.argv[2] ?? '../sample.fit'
  const buffer = readFileSync(filePath)
  let count = 0

  for await (const event of parseFile(buffer)) {
    count += 1
    console.log(JSON.stringify(event))
  }

  console.log(`Parsed ${count} events from ${filePath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
