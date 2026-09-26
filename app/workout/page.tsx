'use client'

import { CameraFeed } from '@/components/camera-feed'
import { PotionInventory } from '@/components/ui/potion-inventory'
import { WorkoutHud } from '@/components/ui/workout-hud'
import { DropModal } from '@/components/ui/drop-modal'

export default function WorkoutPage() {
  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-4 rounded-[28px] border border-slate-700 bg-slate-900/80 p-5 shadow-[0_0_28px_rgba(34,211,238,0.08)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-cyan-300">RNG workout</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">tlqtlq</h1>
        </div>
        <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300">
          1 in 2 Basic Potion drop chance
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.7fr]">
        <div className="space-y-6">
          <CameraFeed />
          <WorkoutHud />
        </div>

        <div className="space-y-6">
          <PotionInventory />
        </div>
      </div>

      <DropModal />
    </div>
  )
}
