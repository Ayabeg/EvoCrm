import { useEffect, useState } from 'react';
import { Moon, Sun } from '@/evo/icons';
import { formatMoney, formatPhone } from '@/evo/lib/format';
import type { TokenSwatch } from '@/evo/tokens/palette';
import {
    DARK_SWATCHES,
    LIGHT_SWATCHES,
    TYPE_ROLES,
} from '@/evo/tokens/palette';

function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
}

function readThemeParam(): 'light' | 'dark' {
    if (typeof window === 'undefined') {
        return 'light';
    }

    const requested = new URLSearchParams(window.location.search).get('theme');

    return requested === 'dark' ? 'dark' : 'light';
}

function SwatchGrid({
    swatches,
    dark,
}: {
    swatches: TokenSwatch[];
    dark?: boolean;
}) {
    return (
        <div
            className={
                dark
                    ? 'grid gap-3 rounded-[10px] bg-[var(--evo-canvas)] p-4 text-[var(--evo-ink)] sm:grid-cols-2 xl:grid-cols-3'
                    : 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3'
            }
            data-evo-theme={dark ? 'dark' : undefined}
        >
            {swatches.map((swatch) => (
                <article
                    key={`${dark ? 'dark' : 'light'}-${swatch.token}`}
                    className="overflow-hidden rounded-[10px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)]"
                >
                    <div
                        className="h-16 border-b border-[var(--evo-hairline)]"
                        style={{ background: swatch.hex }}
                    />
                    <div className="px-3 py-2.5">
                        <p className="text-[13px] font-medium">{swatch.role}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-[var(--evo-ink-muted)]">
                            {swatch.token}
                        </p>
                        <p className="mt-1 font-mono text-[12px]">{swatch.hex}</p>
                        <p className="mt-1 text-[12px] text-[var(--evo-ink-secondary)]">
                            {swatch.usage}
                        </p>
                    </div>
                </article>
            ))}
        </div>
    );
}

export function TokensPage() {
    const [theme, setTheme] = useState<'light' | 'dark'>(readThemeParam);
    const [simulateReduce, setSimulateReduce] = useState(false);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    return (
        <div className="mx-auto max-w-[1120px] pb-16">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--evo-hairline)] pb-5">
                <div>
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">
                        Système de design · Phase 1
                    </p>
                    <h1 className="mt-1 text-[length:var(--evo-text-24)] leading-none font-semibold tracking-[-0.03em]">
                        Jetons
                    </h1>
                    <p className="mt-2 max-w-[42rem] text-[13px] text-[var(--evo-ink-muted)]">
                        Palette, type, densité et mouvement pour EvoCRM. L’encre
                        structure. L’orange n’agit que pour une action
                        volontaire. La sarcelle marque le focus et la
                        sélection.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-3 text-[13px]"
                        onClick={() => {
                            setTheme((current) =>
                                current === 'light' ? 'dark' : 'light',
                            );
                        }}
                    >
                        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                        {theme === 'dark' ? 'Claire' : 'Cabinet'}
                    </button>
                </div>
            </header>

            <section className="mt-8">
                <h2 className="text-[16px] font-semibold">Règles orange / sarcelle</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <article className="rounded-[10px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-4">
                        <p className="text-[12px] tracking-[0.04em] text-[var(--evo-ink-muted)] uppercase">
                            Orange · action
                        </p>
                        <p className="mt-2 text-[13px] text-[var(--evo-ink-secondary)]">
                            Un seul bouton plein par vue. Libellé en encre
                            sombre — le blanc sur var(--evo-primary) échoue AA (3.35:1).
                        </p>
                        <button
                            type="button"
                            className="mt-4 inline-flex h-9 items-center rounded-[8px] bg-[var(--evo-primary)] px-3 text-[14px] font-medium text-[var(--evo-on-primary)]"
                        >
                            Créer une affaire
                        </button>
                        <p className="mt-3 text-[12px] text-[var(--evo-ink-muted)]">
                            {formatMoney(1_280_000)} · Clinique El Djazair
                        </p>
                    </article>
                    <article className="rounded-[10px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-4">
                        <p className="text-[12px] tracking-[0.04em] text-[var(--evo-ink-muted)] uppercase">
                            Sarcelle · focus et sélection
                        </p>
                        <p className="mt-2 text-[13px] text-[var(--evo-ink-secondary)]">
                            Anneau 2px + décalage 2px. Jamais d’orange sur le
                            focus, une ligne active ou un graphique par défaut.
                        </p>
                        <button
                            type="button"
                            className="mt-4 inline-flex h-9 items-center rounded-[8px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-3 text-[14px] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-focus)]"
                        >
                            {formatPhone('0550188001')}
                        </button>
                        <div className="mt-3 overflow-hidden rounded-[8px] border border-[var(--evo-hairline)]">
                            <div className="flex h-9 items-center bg-[var(--evo-teal-soft)] px-3 text-[13px] text-[var(--evo-teal)]">
                                Clinique El Djazair — sélectionnée
                            </div>
                            <div className="flex h-9 items-center px-3 text-[13px] text-[var(--evo-ink-secondary)]">
                                Hôpital Ibn Sina
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            <section className="mt-10">
                <h2 className="text-[16px] font-semibold">Palette claire</h2>
                <p className="mt-1 text-[13px] text-[var(--evo-ink-muted)]">
                    Toile var(--evo-canvas), surface blanche, encre var(--evo-ink). var(--evo-logo) reste
                    sur le logo.
                </p>
                <div className="mt-4">
                    <SwatchGrid swatches={LIGHT_SWATCHES} />
                </div>
            </section>

            <section className="mt-10">
                <h2 className="text-[16px] font-semibold">Cabinet sombre</h2>
                <p className="mt-1 text-[13px] text-[var(--evo-ink-muted)]">
                    Une seule échelle : var(--evo-canvas) / var(--evo-on-primary) / var(--evo-surface-subtle). Pas de
                    blanc pur, pas de glow, pas de verre.
                </p>
                <div className="mt-4">
                    <SwatchGrid swatches={DARK_SWATCHES} dark />
                </div>
            </section>

            <section className="mt-10">
                <h2 className="text-[16px] font-semibold">Échelle typographique</h2>
                <p className="mt-1 text-[13px] text-[var(--evo-ink-muted)]">
                    Geist uniquement. 11 / 12 / 13 / 14 / 16 / 18 / 20 / 24 / 32.
                    Chiffres tabulaires.
                </p>
                <div className="mt-4 divide-y divide-[var(--evo-hairline)] rounded-[10px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)]">
                    {TYPE_ROLES.map((row) => (
                        <div
                            key={row.role}
                            className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-4 py-3"
                        >
                            <p className="w-28 text-[12px] text-[var(--evo-ink-muted)]">
                                {row.role} · {row.size}
                            </p>
                            <p
                                className="min-w-0 flex-1 font-medium tracking-[-0.02em]"
                                style={{ fontSize: row.size }}
                            >
                                {row.sample}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-10 grid gap-6 lg:grid-cols-2">
                <div>
                    <h2 className="text-[16px] font-semibold">Densité</h2>
                    <p className="mt-1 text-[13px] text-[var(--evo-ink-muted)]">
                        Contrôles 32 compact / 36 standard. Lignes de table
                        32–36.
                    </p>
                    <div className="mt-4 space-y-3 rounded-[10px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-4">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="inline-flex h-8 items-center rounded-[8px] border border-[var(--evo-hairline)] px-3 text-[13px]"
                            >
                                Filtrer · 32
                            </button>
                            <button
                                type="button"
                                className="inline-flex h-9 items-center rounded-[8px] border border-[var(--evo-hairline)] px-3 text-[13px]"
                            >
                                Enregistrer · 36
                            </button>
                        </div>
                        <div className="overflow-hidden rounded-[8px] border border-[var(--evo-hairline)] text-[13px]">
                            <div className="flex h-8 items-center justify-between px-3">
                                <span>Devis v2</span>
                                <span className="tabular-nums">
                                    {formatMoney(1_280_000)}
                                </span>
                            </div>
                            <div className="flex h-9 items-center justify-between bg-[var(--evo-surface-subtle)] px-3">
                                <span>Appel de suivi</span>
                                <span className="text-[var(--evo-ink-muted)]">
                                    32–36
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className="text-[16px] font-semibold">Rayons</h2>
                    <p className="mt-1 text-[13px] text-[var(--evo-ink-muted)]">
                        8 / 10 / 12 / 999. Pas de rayon tableau de bord à 20px.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        {[
                            { label: 'Compact 8', radius: 8 },
                            { label: 'Standard 10', radius: 10 },
                            { label: 'Flottant 12', radius: 12 },
                            { label: 'Pilule 999', radius: 999 },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="flex h-16 items-center justify-center border border-[var(--evo-hairline)] bg-[var(--evo-surface)] text-[12px] text-[var(--evo-ink-secondary)]"
                                style={{ borderRadius: item.radius }}
                            >
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mt-10">
                <h2 className="text-[16px] font-semibold">Mouvement</h2>
                <p className="mt-1 text-[13px] text-[var(--evo-ink-muted)]">
                    Micro 120ms · normal 200ms · contexte 240ms · easing
                    cubic-bezier(0.2, 0.8, 0.2, 1). L’app entière respecte
                    prefers-reduced-motion.
                </p>
                <label className="mt-3 flex items-center gap-2 text-[13px]">
                    <input
                        type="checkbox"
                        checked={simulateReduce}
                        onChange={(event) => {
                            setSimulateReduce(event.target.checked);
                        }}
                    />
                    Simuler prefers-reduced-motion
                </label>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {[
                        { label: 'Micro 120ms', duration: '120ms' },
                        { label: 'Normal 200ms', duration: '200ms' },
                        { label: 'Contexte 240ms', duration: '240ms' },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="rounded-[10px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-4"
                        >
                            <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                {item.label}
                            </p>
                            <div
                                className="mt-3 h-8 w-8 rounded-[8px] bg-[var(--evo-teal)]"
                                style={{
                                    animation: simulateReduce
                                        ? 'none'
                                        : `evo-token-shift ${item.duration} var(--evo-ease) infinite alternate`,
                                }}
                            />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
