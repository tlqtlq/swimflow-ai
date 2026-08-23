export type SeededSwimmer = {
    id?: string
    name: string
    firstName?: string | null
    lastName?: string | null
    seedTime?: string | number | null
    seedTimeSeconds?: number | null
}

export type SeededHeatEntry = {
    lane: number
    swimmer: SeededSwimmer
}

export type SeededHeat = {
    heatNumber: number
    entries: SeededHeatEntry[]
}

const parseSeconds = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined || value === '') {
        return Number.POSITIVE_INFINITY
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY
    }

    const trimmed = value.trim()
    if (!trimmed || trimmed.toUpperCase() === 'NT' || trimmed.toUpperCase() === 'NO TIME') {
        return Number.POSITIVE_INFINITY
    }

    const normalized = trimmed.replace(/\s+/g, '')
    if (!normalized.includes(':')) {
        return Number(normalized) || Number.POSITIVE_INFINITY
    }

    const [minutes, seconds] = normalized.split(':')
    const parsedMinutes = Number(minutes)
    const parsedSeconds = Number(seconds)
    if (Number.isNaN(parsedMinutes) || Number.isNaN(parsedSeconds)) {
        return Number.POSITIVE_INFINITY
    }

    return parsedMinutes * 60 + parsedSeconds
}

const gateSort = (a: SeededSwimmer, b: SeededSwimmer) => {
    const aTime = a.seedTimeSeconds ?? parseSeconds(a.seedTime ?? null)
    const bTime = b.seedTimeSeconds ?? parseSeconds(b.seedTime ?? null)

    if (aTime !== bTime) {
        return aTime - bTime
    }

    const aName = `${a.firstName ?? ''} ${a.lastName ?? a.name ?? ''}`.trim() || a.name || ''
    const bName = `${b.firstName ?? ''} ${b.lastName ?? b.name ?? ''}`.trim() || b.name || ''
    return aName.localeCompare(bName)
}

const laneOrderForPool = (poolLanes: number): number[] => {
    if (poolLanes === 8) {
        return [1, 2, 3, 4, 5, 6, 7, 8]
    }

    return [3, 4, 2, 5, 1, 6]
}

export const seedHeatEntries = (
    swimmers: SeededSwimmer[],
    poolLanes = 6,
): SeededHeat[] => {
    const safePoolLanes = poolLanes === 8 ? 8 : 6
    const sorted = [...swimmers].sort(gateSort)
    const heats: SeededHeat[] = []

    for (let index = 0; index < sorted.length; index += safePoolLanes) {
        const heatSwimmers = sorted.slice(index, index + safePoolLanes)
        const laneOrder = laneOrderForPool(safePoolLanes)
        const entries: SeededHeatEntry[] = heatSwimmers.map((swimmer, swimmerIndex) => ({
            lane: laneOrder[swimmerIndex] ?? swimmerIndex + 1,
            swimmer,
        }))

        heats.push({
            heatNumber: heats.length + 1,
            entries: entries.sort((a, b) => a.lane - b.lane),
        })
    }

    return heats
}

export const seedEventEntries = (
    swimmers: SeededSwimmer[],
    poolLanes = 6,
): SeededHeatEntry[] => {
    return seedHeatEntries(swimmers, poolLanes).flatMap((heat) => heat.entries)
}
