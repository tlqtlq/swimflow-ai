'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Gift, Sparkles, X } from 'lucide-react'
import { useRngStore } from '@/store/use-rng-store'

export function DropModal() {
  const lastDrop = useRngStore((state) => state.lastDrop)
  const dismissDrop = useRngStore((state) => state.dismissDrop)

  return (
    <AnimatePresence>
      {lastDrop.visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 16, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-cyan-500/30 bg-slate-900 p-6 shadow-[0_0_40px_rgba(34,211,238,0.18)]"
          >
            <button
              type="button"
              onClick={dismissDrop}
              className="absolute right-4 top-4 rounded-full border border-slate-700 bg-slate-950/70 p-1.5 text-slate-300"
              aria-label="Dismiss drop message"
            >
              <X size={16} />
            </button>

            <div className="flex items-center justify-center text-4xl text-emerald-300">
              {lastDrop.kind === 'success' ? <Gift /> : <Sparkles />}
            </div>

            <p className="mt-6 text-center text-xs uppercase tracking-[0.22em] text-cyan-300">
              {lastDrop.kind === 'success' ? 'Potion drop' : 'No drop'}
            </p>
            <h3 className="mt-3 text-center text-2xl font-black text-white">{lastDrop.message}</h3>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={dismissDrop}
                className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm font-semibold text-cyan-200"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
