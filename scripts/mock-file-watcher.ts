import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const WATCH_DIR = path.join(ROOT, 'mock_results')
const TARGET_URL = process.env.FILE_WATCH_TARGET_URL || 'http://localhost:3000/api/ingest/file-watch'

const fileToResults = async (filePath: string) => {
    const content = await fs.promises.readFile(filePath, 'utf8')
    const ext = path.extname(filePath).toLowerCase()

    if (ext === '.json') {
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) {
            return parsed
        }
        if (parsed && Array.isArray(parsed.results)) {
            return parsed
        }
        throw new Error(`Unsupported JSON payload in ${filePath}`)
    }

    if (ext === '.cl2') {
        const lines = content.split(/\r?\n/).filter(Boolean)
        const eventMatch = lines.find((line) => /event/i.test(line))
        const eventName = eventMatch ? eventMatch.replace(/^.*event\s*[:=-]?\s*/i, '').trim() : 'Event Results'
        const results = lines
            .filter((line) => /\d/.test(line) && /[A-Za-z]/.test(line))
            .map((line) => {
                const cells = line.split(',').map((value) => value.trim())
                const place = Number(cells[0] ?? 0)
                const swimmerName = cells[1] || cells[0] || 'Unknown swimmer'
                const finalTime = cells[2] || cells[3] || '0.00'
                return { place, swimmerName, finalTime }
            })
            .filter((result) => result.swimmerName && result.finalTime)

        return {
            meetId: 'b8dc103d-d891-4c96-8c1e-e2a7a7a8a833',
            eventName,
            heatNumber: 1,
            results,
        }
    }

    throw new Error(`Unsupported file type: ${ext}`)
}

const postPayload = async (payload: any) => {
    const response = await fetch(TARGET_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
    })

    const text = await response.text()
    if (!response.ok) {
        throw new Error(`File watch API rejected request: ${response.status} ${text}`)
    }

    console.log(`Posted file-watch payload to ${TARGET_URL}: ${text}`)
}

const processFile = async (filePath: string) => {
    const parsed = await fileToResults(filePath)
    if (parsed && Array.isArray(parsed.results)) {
        await postPayload(parsed)
    } else if (parsed && parsed.meetId) {
        await postPayload(parsed)
    } else {
        throw new Error(`Unrecognized payload in ${filePath}`)
    }

    await fs.promises.rename(filePath, `${filePath}.processed`)
    console.log(`Processed ${path.basename(filePath)}`)
}

const watchFolder = async () => {
    await fs.promises.mkdir(WATCH_DIR, { recursive: true })
    console.log(`Watching ${WATCH_DIR} for .cl2 and .json files...`)

    const seen = new Set<string>()
    const scan = async () => {
        for (const file of await fs.promises.readdir(WATCH_DIR)) {
            const filePath = path.join(WATCH_DIR, file)
            const stat = await fs.promises.stat(filePath)
            if (!stat.isFile()) continue
            if (seen.has(filePath)) continue
            seen.add(filePath)
            const ext = path.extname(file).toLowerCase()
            if (ext === '.cl2' || ext === '.json') {
                try {
                    await processFile(filePath)
                } catch (error) {
                    console.error(`Unable to process ${file}:`, error)
                }
            }
        }
    }

    await scan()
    fs.watch(WATCH_DIR, { persistent: true }, async (_eventType, filename) => {
        if (!filename) return
        const filePath = path.join(WATCH_DIR, filename)
        if (!filePath.endsWith('.cl2') && !filePath.endsWith('.json')) return
        try {
            await processFile(filePath)
        } catch (error) {
            console.error(`Unable to process ${filename}:`, error)
        }
    })
}

watchFolder().catch((error) => {
    console.error('Mock file watcher failed:', error)
    process.exit(1)
})
