import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="EvoSales" />
            <div className="min-h-screen bg-slate-950 text-slate-100">
                <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
                    <span className="text-lg font-semibold tracking-tight">EvoSales</span>
                    <nav className="flex gap-3 text-sm">
                        {auth.user ? (
                            <Link href="/dashboard" className="rounded-md border border-slate-700 px-4 py-1.5">
                                Open workspace
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="rounded-md px-4 py-1.5">
                                    Log in
                                </Link>
                                <Link href="/register" className="rounded-md border border-teal-500/40 px-4 py-1.5 text-teal-200">
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </header>
                <main className="mx-auto max-w-5xl px-6 py-16">
                    <p className="text-sm uppercase tracking-[0.2em] text-teal-300">Evotechly · Africa/Algiers · +213</p>
                    <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight">
                        One sales OS. Desk, CRM, Ads, and Outbound in a single login.
                    </h1>
                    <p className="mt-4 max-w-2xl text-slate-300">
                        Official WhatsApp Cloud API only, through Evolution API in Business API mode.
                        Not Baileys. Not a Kommo clone. Not an Instantly clone. Not Chatwoot Enterprise.
                    </p>
                    <div className="mt-10 grid gap-4 md:grid-cols-4">
                        {[
                            ['Desk', 'Three-pane inbox. Click-to-WA lands as a thread on a Contact.'],
                            ['CRM', 'Companies, contacts, leads, deals. New → Won/Lost.'],
                            ['Ads', 'Meta accounts, campaigns, lead forms. Env-driven credentials.'],
                            ['Outbound', 'SMTP, sequences, Cloud templates, quiet hours, suppression.'],
                        ].map(([title, copy]) => (
                            <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <h2 className="font-medium text-teal-200">{title}</h2>
                                <p className="mt-2 text-sm text-slate-400">{copy}</p>
                            </article>
                        ))}
                    </div>
                </main>
            </div>
        </>
    );
}
