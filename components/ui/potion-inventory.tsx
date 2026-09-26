'use client'

import { motion } from 'framer-motion'
import { FlaskConical, TimerReset } from 'lucide-react'
import { useRngStore } from '@/store/use-rng-store'

export function PotionInventory() {
  const inventory = useRngStore((state) => state.inventory)
  const activeLuckUntil = useRngStore((state) => state.activeLuckUntil)
  const consumePotion = useRngStore((state) => state.consumePotion)
  const timerSeconds = useRngStore((state) => state.getTimerSeconds())

  return (
    <div className="rounded-[24px] border border-emerald-500/25 bg-slate-900/80 p-5 shadow-[0_0_24px_rgba(16,185,129,0.12)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Inventory</p>
          <h3 className="mt-2 text-xl font-bold text-white">Basic Potion</h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
          <FlaskConical size={20} />
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-300">
        A glowing vial forged from raw effort. Grants a temporary 1.5x luck multiplier on future RNG drops for 60 seconds.
      </p>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
        <span>Owned</span>
        <strong className="text-lg font-semibold text-emerald-300">{inventory}</strong>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={consumePotion}
        disabled={inventory <= 0}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 px-4 py-3 text-sm font-bold text-slate-950 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      >
        <TimerReset size={16} />
        {inventory > 0 ? 'Inbibe / Consume' : 'Out of stock'}
      </motion.button>

      <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-sm text-cyan-200">
        {activeLuckUntil && timerSeconds > 0 ? `Lucky streak active: ${timerSeconds}s remaining` : 'No active 1.5x boon'}
      </div>
    </div>
  )
}
