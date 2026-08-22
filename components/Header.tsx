import React from 'react'
import { Upload } from 'lucide-react'
import Image from 'next/image'

export default function Header() {
    return (
        <header className="bg-white border-b">
            <div className="container flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                    <a href="/dashboard" className="flex items-center">
                        <Image src="/logo.png" alt="SwimFlow.ai Home" width={240} height={56} className="h-14 w-auto object-contain" priority />
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
                    <a href="/dashboard" className="px-3 py-1 bg-slate-800 text-white rounded">Create Meet</a>
                </div>
            </div>
        </header>
    )
}
