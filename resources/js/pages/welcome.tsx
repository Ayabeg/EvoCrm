import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="EvoSales · Evotechly" />
            <div className="min-h-screen bg-canvas text-ink">
                <div className="aurora-hero text-canvas">
                    <header className="mx-auto flex h-[52px] max-w-5xl items-center justify-between px-6">
                        <Link href="/" className="flex items-center gap-2">
                            <img
                                src="/brand/evotechly/mark.svg"
                                alt="Evotechly"
                                className="size-7"
                            />
                            <span className="text-sm font-semibold tracking-tight">
                                EvoSales
                            </span>
                        </Link>
                        <nav className="flex gap-2 text-sm">
                            {auth.user ? (
                                <Link
                                    href="/dashboard"
                                    className="rounded-md bg-canvas px-3 py-1.5 text-brand"
                                >
                                    Open workspace
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" className="rounded-md px-3 py-1.5">
                                        Log in
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="rounded-md bg-canvas px-3 py-1.5 text-brand"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>
                    <main className="mx-auto max-w-5xl px-6 py-16">
                        <p className="text-xs tracking-[0.16em] uppercase">
                            Evotechly · Africa/Algiers · +213
                        </p>
                        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight">
                            One sales OS. Desk, CRM, Ads, and Outbound in a
                            single login.
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm text-canvas/80">
                            Official WhatsApp Cloud API only, through Evolution
                            API in Business API mode. Desk is EvoDesk (Chatwoot
                            Community). Not Baileys. Not a Kommo clone.
                        </p>
                    </main>
                </div>
                <section className="mx-auto grid max-w-5xl gap-3 px-6 py-10 md:grid-cols-4">
                    {[
                        [
                            'Desk',
                            'EvoDesk / Chatwoot Community at desk.evotechly.com. Open from the nav — not a Laravel clone.',
                        ],
                        [
                            'CRM',
                            'Companies, contacts, leads, deals. Conversation history synced from the desk.',
                        ],
                        [
                            'Ads',
                            'Meta accounts, campaigns, lead forms. Env-driven credentials.',
                        ],
                        [
                            'Outbound',
                            'SMTP, sequences, Cloud templates, quiet hours, suppression.',
                        ],
                    ].map(([title, copy]) => (
                        <article
                            key={title}
                            className="rounded-lg border border-hairline bg-canvas p-4"
                        >
                            <h2 className="font-medium">{title}</h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {copy}
                            </p>
                        </article>
                    ))}
                </section>
            </div>
        </>
    );
}
