import React from 'react'
import { Upload } from 'lucide-react'
import Image from 'next/image'

export default function Header() {
    return (
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
            <div className="container flex min-h-16 items-center justify-between py-2">
                <div className="flex items-center gap-5">
                    <a href="/dashboard" className="flex items-center">
                        <Image src="/logo.png" alt="SwimFlow.ai Home" width={240} height={48} style={{ width: 'auto' }} className="h-10 w-auto object-contain md:h-12" priority />
                    </a>
                    <nav className="flex items-center gap-4">
                        <a href="/dashboard" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                            Dashboard
                        </a>
                        <a href="/dashboard#active-meets" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                            Meets
                        </a>
                        <a href="/dashboard" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                            Upload
                        </a>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <a href="/dashboard" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                        <Upload size={16} />
                        Import
                    </a>
                    <a href="/dashboard" className="rounded-lg bg-[#003296] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#002878]">Create Meet</a>
                </div>
            </div>
        </header>
    )
}
