import HeatAlertControls from '@/components/HeatAlertControls'

export default function BrowserAlerts({ meetId }: { meetId: string }) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Browser alerts</h2>
        <p className="mt-2 text-sm text-slate-600">Get free on-device alerts when a heat is called. No phone number or paid SMS provider is required.</p>
        <HeatAlertControls meetId={meetId} tone="light" />
    </div>
}
