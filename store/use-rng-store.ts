'use client'

import { create } from 'zustand'

export type DropState = {
  visible: boolean
  kind: 'success' | 'failure' | null
  message: string
}

type RngStats = {
  totalReps: number
  successfulRolls: number
  failedRolls: number
}

type RngStore = {
  stats: RngStats
  inventory: number
  activeLuckUntil: number | null
  lastDrop: DropState
  registerRep: () => void
  consumePotion: () => void
  dismissDrop: () => void
  getLuckChance: () => number
  getTimerSeconds: () => number
}

const BASE_DROP_RATE = 0.5
const LUCK_MULTIPLIER = 1.5
const POTION_DURATION_MS = 60_000

export const useRngStore = create<RngStore>((set, get) => ({
  stats: {
    totalReps: 0,
    successfulRolls: 0,
    failedRolls: 0,
  },
  inventory: 2,
  activeLuckUntil: null,
  lastDrop: {
    visible: false,
    kind: null,
    message: '',
  },
  getLuckChance: () => {
    const activeLuckUntil = get().activeLuckUntil
    const hasBuff = activeLuckUntil && Date.now() < activeLuckUntil
    return hasBuff ? BASE_DROP_RATE * LUCK_MULTIPLIER : BASE_DROP_RATE
  },
  getTimerSeconds: () => {
    const activeLuckUntil = get().activeLuckUntil
    if (!activeLuckUntil) return 0

    const remainingMs = Math.max(0, activeLuckUntil - Date.now())
    return Math.ceil(remainingMs / 1000)
  },
  registerRep: () => {
    const baseChance = get().getLuckChance()
    const rollValue = Math.random()
    const success = rollValue < baseChance

    set((state) => ({
      stats: {
        ...state.stats,
        totalReps: state.stats.totalReps + 1,
        successfulRolls: success ? state.stats.successfulRolls + 1 : state.stats.successfulRolls,
        failedRolls: success ? state.stats.failedRolls : state.stats.failedRolls + 1,
      },
      inventory: success ? state.inventory + 1 : state.inventory,
      lastDrop: {
        visible: true,
        kind: success ? 'success' : 'failure',
        message: success
          ? 'BASIC POTION OBTAINED! (1 in 2 Drop)'
          : 'No Drop (50% Chance)',
      },
    }))
  },
  consumePotion: () => {
    set((state) => {
      if (state.inventory <= 0) return state

      return {
        inventory: state.inventory - 1,
        activeLuckUntil: Date.now() + POTION_DURATION_MS,
      }
    })
  },
  dismissDrop: () => {
    set({ lastDrop: { visible: false, kind: null, message: '' } })
  },
}))
