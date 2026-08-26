'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function ScrollRefresh() {
    const router = useRouter()
    const touchStartY = useRef<number | null>(null)
    const [pullDistance, setPullDistance] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)

    useEffect(() => {
        const onTouchStart = (event: TouchEvent) => {
            if (window.scrollY > 0) return
            touchStartY.current = event.touches[0]?.clientY ?? null
            setPullDistance(0)
        }

        const onTouchMove = (event: TouchEvent) => {
            if (touchStartY.current === null || window.scrollY > 0 || isRefreshing) return
            const delta = (event.touches[0]?.clientY ?? touchStartY.current) - touchStartY.current
            if (delta > 0) {
                setPullDistance(Math.min(delta, 120))
            }
        }

        const onTouchEnd = () => {
            if (touchStartY.current === null) return

            if (pullDistance >= 80 && !isRefreshing) {
                setIsRefreshing(true)
                router.refresh()
                window.setTimeout(() => {
                    setIsRefreshing(false)
                    setPullDistance(0)
                }, 500)
            } else {
                setPullDistance(0)
            }

            touchStartY.current = null
        }

        window.addEventListener('touchstart', onTouchStart, { passive: true })
        window.addEventListener('touchmove', onTouchMove, { passive: true })
        window.addEventListener('touchend', onTouchEnd, { passive: true })

        return () => {
            window.removeEventListener('touchstart', onTouchStart)
            window.removeEventListener('touchmove', onTouchMove)
            window.removeEventListener('touchend', onTouchEnd)
        }
    }, [isRefreshing, pullDistance, router])

    return (
        <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center" style={{ height: isRefreshing ? 48 : Math.min(pullDistance, 80) }}>
            <div
                className="mt-2 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-lg backdrop-blur-sm transition-transform duration-200"
                style={{ transform: `translateY(${Math.min(pullDistance, 80) - 12}px) rotate(${isRefreshing ? 180 : pullDistance * 1.5}deg)` }}
            >
                ↻
            </div>
        </div>
    )
}
