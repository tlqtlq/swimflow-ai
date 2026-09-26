'use client'

import { Camera, Loader2, ShieldAlert, Video } from 'lucide-react'
import { usePoseDetection } from '@/hooks/use-pose-detection'

export function CameraFeed() {
  const { videoRef, canvasRef, status, feedback, isLoading, isCameraReady, error } = usePoseDetection()

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-700 bg-slate-950 shadow-[0_0_32px_rgba(34,211,238,0.12)]">
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900/80 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <Video size={16} className="text-cyan-300" />
          Live Camera Feed
        </div>
        <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-200">
          {isCameraReady ? 'Live' : 'Standby'}
        </div>
      </div>

      <div className="relative aspect-video w-full bg-slate-950">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover opacity-95" />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {!isCameraReady && !error ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/80">
            <div className="flex flex-col items-center gap-3 text-slate-200">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
              <p className="text-sm text-slate-300">Booting AI tracking…</p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/80 px-5 text-center">
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-100">
              <div className="mb-2 flex justify-center text-red-300">
                <ShieldAlert size={20} />
              </div>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-slate-700 bg-slate-900/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">AI status</p>
            <h3 className="mt-2 text-lg font-bold text-white">{status}</h3>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            <Camera size={18} />
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">{feedback}</p>
        {isLoading ? <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">Initializing state engine…</p> : null}
      </div>
    </div>
  )
}
