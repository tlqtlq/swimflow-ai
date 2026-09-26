'use client'

import { Activity, Sparkles, Swords, Zap } from 'lucide-react'
import { useRngStore } from '@/store/use-rng-store'

export function WorkoutHud() {
  const stats = useRngStore((state) => state.stats)
  const inventory = useRngStore((state) => state.inventory)
  const getLuckChance = useRngStore((state) => state.getLuckChance)
  const timerSeconds = useRngStore((state) => state.getTimerSeconds())
  const getChanceLabel = () => `${(getLuckChance() * 100).toFixed(0)}%`

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-4 shadow-[0_0_22px_rgba(34,211,238,0.14)]">
          <div className="flex items-center justify-between text-cyan-300">
            <Activity size={16} />
            <span className="text-xs uppercase tracking-[0.18em]">Reps</span>
          </div>
          <p className="mt-4 text-3xl font-black text-white">{stats.totalReps}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/70 p-4 shadow-[0_0_22px_rgba(16,185,129,0.14)]">
          <div className="flex items-center justify-between text-emerald-300">
            <Sparkles size={16} />
            <span className="text-xs uppercase tracking-[0.18em]">Drops</span>
          </div>
          <p className="mt-4 text-3xl font-black text-white">{stats.successfulRolls}</p>
        </div>

        <div className="rounded-2xl border border-fuchsia-500/20 bg-slate-900/70 p-4 shadow-[0_0_22px_rgba(217,70,239,0.14)]">
          <div className="flex items-center justify-between text-fuchsia-300">
            <Swords size={16} />
            <span className="text-xs uppercase tracking-[0.18em]">Misses</span>
          </div>
          <p className="mt-4 text-3xl font-black text-white">{stats.failedRolls}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Active brew</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{timerSeconds > 0 ? 'Luck Surge' : 'No active buff'}</h3>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-300">
            <Zap size={14} />
            {timerSeconds > 0 ? `${timerSeconds}s` : `${getChanceLabel()} drop rate`}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-300">
          <span>Basic Potions</span>
          <strong className="text-base text-emerald-300">{inventory}</strong>
        </div>
      </div>
    </div>
  )
}
