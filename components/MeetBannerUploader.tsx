'use client'

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { UploadCloud, X } from 'lucide-react'

const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function MeetBannerUploader({ meetId, bannerUrl, onBannerUrlChange }: { meetId: string; bannerUrl?: string | null; onBannerUrlChange?: (nextUrl: string | null) => void }) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [preview, setPreview] = useState<string | null>(bannerUrl ?? null)

    useEffect(() => {
        setPreview(bannerUrl ?? null)
    }, [bannerUrl])

    const validateFile = (file: File) => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return 'Use JPG, PNG, or WebP images under 5MB.'
        }
        if (file.size > MAX_SIZE_BYTES) {
            return 'Image must be 5MB or smaller.'
        }
        return ''
    }

    const processFile = async (file: File) => {
        const validationMessage = validateFile(file)
        if (validationMessage) {
            setError(validationMessage)
            return
        }

        setError('')
        setUploading(true)

        try {
            const imageBitmap = await createImageBitmap(file)
            const width = imageBitmap.width
            const height = imageBitmap.height
            const targetRatio = 16 / 9
            const sourceRatio = width / height
            const cropWidth = sourceRatio > targetRatio ? height * targetRatio : width
            const cropHeight = sourceRatio > targetRatio ? height : width / targetRatio
            const canvas = document.createElement('canvas')
            canvas.width = 1600
            canvas.height = 900
            const context = canvas.getContext('2d')
            if (!context) {
                throw new Error('Canvas not available in this browser.')
            }
            const offsetX = (width - cropWidth) / 2
            const offsetY = (height - cropHeight) / 2
            context.fillStyle = '#0f172a'
            context.fillRect(0, 0, canvas.width, canvas.height)
            context.drawImage(imageBitmap, offsetX, offsetY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height)
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((nextBlob) => {
                    if (!nextBlob) return reject(new Error('Unable to process the banner image.'))
                    resolve(nextBlob)
                }, 'image/jpeg', 0.88)
            })

            const normalizedName = `${meetId}-banner-${Date.now()}.jpg`
            const formData = new FormData()
            formData.append('file', blob, normalizedName)

            const response = await fetch(`/api/uploads/banner?meetId=${encodeURIComponent(meetId)}`, {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const payload = await response.json().catch(() => ({ message: 'Unable to upload banner image.' }))
                throw new Error(payload.message || 'Unable to upload banner image.')
            }

            const payload = await response.json() as { url?: string }
            const nextUrl = payload.url ?? null
            setPreview(nextUrl)
            if (onBannerUrlChange) onBannerUrlChange(nextUrl)
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload banner image.')
        } finally {
            setUploading(false)
        }
    }

    const handleInput = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            await processFile(file)
            event.target.value = ''
        }
    }

    const handleDrop = async (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault()
        setIsDragging(false)
        const file = event.dataTransfer.files?.[0]
        if (file) await processFile(file)
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">Meet banner</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">Custom spectator cover image</h3>
                </div>
                {preview ? (
                    <button type="button" onClick={() => { setPreview(null); if (onBannerUrlChange) onBannerUrlChange(null) }} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <X size={14} /> Remove
                    </button>
                ) : null}
            </div>

            <label onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`relative block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-4 transition ${isDragging ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-slate-50 hover:border-sky-400 hover:bg-slate-100'}`}>
                <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleInput} />
                {preview ? (
                    <div className="space-y-3">
                        <div className="relative h-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            <Image src={preview} alt="Meet banner preview" fill className="object-cover" unoptimized />
                        </div>
                        <p className="text-sm text-slate-600">This image is used in the live mobile spectator header banner.</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm"><UploadCloud size={24} /></span>
                        <div>
                            <p className="text-base font-semibold text-slate-900">Drag & drop a banner image</p>
                            <p className="mt-1 text-sm text-slate-600">JPG, PNG, or WebP up to 5MB • 16:9 recommended</p>
                        </div>
                    </div>
                )}
            </label>

            {uploading ? <p className="text-sm text-sky-700">Uploading banner image…</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
    )
}
