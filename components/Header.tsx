import React from 'react'
import { Upload } from 'lucide-react'
import Image from 'next/image'

export default function Header() {
    return (
        <header className="bg-white border-b">
            <div className="container flex items-center justify-between h-20 py-2">
                <div className="flex items-center gap-3">
                    <a href="/dashboard" className="flex items-center">
                        <Image src="/logo.png" alt="SwimFlow.ai Home" width={280} height={64} className="h-16 w-auto object-contain" priority />
                    </a>
                    <nav className="flex gap-3 text-sm text-slate-600">
                        <a href="/dashboard" className="hover:underline">
                            Dashboard
                        </a>
                        <a href="/dashboard#active-meets" className="hover:underline">
                            Meets
                        </a>
                        <a href="/dashboard" className="hover:underline">
                            Upload
                        </a>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <a href="/dashboard" className="flex items-center gap-2 px-3 py-1 border rounded bg-slate-50">
                        <Upload size={16} />
                        Import
                    </a>
                    <a href="/dashboard" className="rounded bg-[#003296] px-3 py-1 text-white hover:bg-[#002878]">Create Meet</a>
                </div>
            </div>
        </header>
    )
}
