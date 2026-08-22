export default function SetupPage({ searchParams }: { searchParams?: { error?: string } }) {
    return (
        <div className="mx-auto max-w-2xl space-y-6 py-10">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">One-time setup required</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">Connect the Supabase tables</h1>
                <p className="mt-3 text-slate-700">The local app is running, but your Supabase project does not have the SwimFlow database tables yet.</p>
                {searchParams?.error ? <p className="mt-3 rounded-lg bg-white p-3 text-sm text-red-700">Supabase reported: {searchParams.error}</p> : null}
            </div>
            <ol className="list-decimal space-y-3 pl-6 text-slate-700">
                <li>Open your Supabase project and choose <strong>SQL Editor</strong>.</li>
                <li>Open the project file <strong>supabase/schema.sql</strong> in VS Code and copy all of its contents.</li>
                <li>Paste it into a new Supabase query and click <strong>Run</strong>.</li>
                <li>Return here and click <strong>Create working demo meet</strong> on the dashboard.</li>
            </ol>
            <a href="/" className="inline-block rounded-xl bg-slate-900 px-4 py-3 font-medium text-white">Back to dashboard</a>
        </div>
    )
}
