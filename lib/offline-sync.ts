export type OfflineMutation = {
    id?: number
    url: string
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body: Record<string, unknown>
    createdAt: number
}

export type MutationResult = {
    queued: boolean
    ok: boolean
    data: Record<string, unknown> | null
}

const databaseName = 'swimflow-offline'
const storeName = 'offline_queue'

const openQueue = () => new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(storeName)) {
            database.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
        }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open offline queue.'))
})

const withStore = async <T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>) => {
    const database = await openQueue()
    return new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(storeName, mode)
        const request = operation(transaction.objectStore(storeName))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('Unable to update offline queue.'))
        transaction.oncomplete = () => database.close()
        transaction.onerror = () => {
            database.close()
            reject(transaction.error ?? new Error('Unable to update offline queue.'))
        }
    })
}

const queueMutation = async (mutation: Omit<OfflineMutation, 'id' | 'createdAt'>) => {
    await withStore('readwrite', (store) => store.add({ ...mutation, createdAt: Date.now() }))
}

const readQueue = async () => {
    const queued = await withStore<OfflineMutation[]>('readonly', (store) => store.getAll())
    return queued.sort((first, second) => first.createdAt - second.createdAt)
}

const removeQueuedMutation = async (id: number) => {
    await withStore('readwrite', (store) => store.delete(id))
}

const parseResponse = async (response: Response) => {
    const text = await response.text()
    if (!text) return null
    try {
        return JSON.parse(text) as Record<string, unknown>
    } catch {
        return { message: text }
    }
}

const sendMutation = async (mutation: Omit<OfflineMutation, 'id' | 'createdAt'>) => {
    const response = await fetch(mutation.url, {
        method: mutation.method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mutation.body),
    })
    return { ok: response.ok, data: await parseResponse(response) }
}

export async function sendOrQueueMutation(mutation: Omit<OfflineMutation, 'id' | 'createdAt'>): Promise<MutationResult> {
    if (!navigator.onLine) {
        await queueMutation(mutation)
        return { queued: true, ok: true, data: null }
    }

    try {
        const result = await sendMutation(mutation)
        return { queued: false, ...result }
    } catch {
        await queueMutation(mutation)
        return { queued: true, ok: true, data: null }
    }
}

export async function flushOfflineQueue() {
    if (!navigator.onLine) return 0

    let flushed = 0
    for (const mutation of await readQueue()) {
        try {
            const result = await sendMutation(mutation)
            if (!result.ok) break
            if (mutation.id !== undefined) await removeQueuedMutation(mutation.id)
            flushed += 1
        } catch {
            break
        }
    }
    return flushed
}

export function startOfflineSync() {
    const flush = () => { void flushOfflineQueue() }
    window.addEventListener('online', flush)
    flush()
    return () => window.removeEventListener('online', flush)
}