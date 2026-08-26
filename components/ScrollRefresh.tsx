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

    useEffect(() => {
        if (isRefreshing) {
            router.refresh()
        }
    }, [isRefreshing, router])

    return null
}
