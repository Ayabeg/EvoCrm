import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Moon, Sun, Warning } from '@/evo/icons';
import { WEEK_STARTS_ON } from '@/evo/lib/format';
import {
    SettingsDangerZone,
    SettingsEmptyState,
    SettingsFormProvider,
    SettingsPage,
    SettingsRow,
    SettingsSaveBar,
    SettingsSection,
    settingsCopy,
} from '@/evo/patterns/settings';
import { Button } from '@/evo/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
    evoZodResolver,
} from '@/evo/ui/form';
import { Input } from '@/evo/ui/input';
import { MoneyInput } from '@/evo/ui/money-input';
import { NativeSelect } from '@/evo/ui/native-select';
import { PhoneInput } from '@/evo/ui/phone-input';
import { TimePicker } from '@/evo/ui/time-picker';

const profileSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(8),
    quota: z.number().min(1),
    start: z.string().min(1),
});

type ProfileValues = z.infer<typeof profileSchema>;

type FamilyState = 'clean' | 'dirty' | 'saving' | 'error' | 'success' | 'danger';

const STATES: { id: FamilyState; label: string }[] = [
    { id: 'clean', label: 'Propre' },
    { id: 'dirty', label: 'Modifié' },
    { id: 'saving', label: 'Enregistrement' },
    { id: 'error', label: 'Erreur' },
    { id: 'success', label: 'Succès' },
    { id: 'danger', label: 'Danger' },
];

function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
}

function readThemeParam(): 'light' | 'dark' {
    if (typeof window === 'undefined') {
        return 'light';
    }

    return new URLSearchParams(window.location.search).get('theme') === 'dark'
        ? 'dark'
        : 'light';
}

function readStateParam(): FamilyState {
    if (typeof window === 'undefined') {
        return 'dirty';
    }

    const value = new URLSearchParams(window.location.search).get('state');

    return STATES.some((item) => item.id === value) ? (value as FamilyState) : 'dirty';
}

export function SettingsLabPage() {
    const [theme, setTheme] = useState<'light' | 'dark'>(readThemeParam);
    const [state, setState] = useState<FamilyState>(readStateParam);
    const [nav, setNav] = useState('profile');

    const defaults = useMemo<ProfileValues>(
        () => ({
            name: 'Amine Bensalem',
            email: 'amine@clinique-el-djazair.dz',
            phone: '+213551234567',
            quota: 1_280_000,
            start: '09:00',
        }),
        [],
    );

    const form = useForm<ProfileValues>({
        resolver: evoZodResolver(profileSchema),
        defaultValues: defaults,
    });

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        if (state === 'error') {
            form.setError('email', { message: 'Saisissez une adresse e-mail valide.' });
            window.setTimeout(() => {
                document.getElementById('lab-email')?.focus();
            }, 0);
        } else {
            form.clearErrors();
        }

        if (state === 'clean' || state === 'success') {
            form.reset(defaults);
        }

        if (state === 'dirty' || state === 'saving') {
            form.setValue('name', 'Amine Bensalem — bloc opératoire', { shouldDirty: true });
        }
    }, [defaults, form, state]);

    const dirty = state === 'dirty' || state === 'saving' || form.formState.isDirty;
    const processing = state === 'saving';

    const sections = [
        { id: 'profile', label: 'Profil' },
        { id: 'workspace', label: 'Espace' },
        { id: 'integrations', label: 'Intégrations' },
    ];

    return (
        <div className="min-h-[100dvh] bg-[var(--evo-canvas)] text-[var(--evo-ink)]">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-5 py-3">
                <div>
                    <h1 className="text-[18px] font-semibold">Settings family</h1>
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">
                        fr-DZ · +213 · DZD · 24h · semaine samedi ({WEEK_STARTS_ON})
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {STATES.map((item) => (
                        <Button
                            key={item.id}
                            size="sm"
                            variant={state === item.id ? 'default' : 'outline'}
                            onClick={() => setState(item.id)}
                        >
                            {item.label}
                        </Button>
                    ))}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                        aria-label={theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
                    >
                        {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    </Button>
                </div>
            </header>

            <div
                data-settings="workspace"
                className="mx-auto mt-6 flex min-h-[640px] max-w-[1120px] overflow-hidden rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] shadow-[var(--evo-shadow-modal)]"
            >
                <aside
                    data-settings="nav"
                    className="hidden w-[16.25rem] shrink-0 border-r border-[var(--evo-hairline)] bg-[var(--evo-canvas)] sm:block"
                >
                    <p className="px-4 pt-4 text-[15px] font-semibold">{settingsCopy.title}</p>
                    <nav className="mt-3 flex flex-col px-2" aria-label="Sections des paramètres">
                        {sections.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                aria-current={nav === item.id ? 'page' : undefined}
                                onClick={() => setNav(item.id)}
                                className={
                                    nav === item.id
                                        ? 'h-8 rounded-[var(--evo-radius-compact)] bg-[var(--evo-teal-soft)] px-2 text-left text-[13px] font-medium text-[var(--evo-teal)]'
                                        : 'h-8 rounded-[var(--evo-radius-compact)] px-2 text-left text-[13px] text-[var(--evo-ink-muted)] hover:bg-[var(--evo-hover)]'
                                }
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                <div data-settings="pane" className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
                    <SettingsFormProvider
                        dirty={dirty}
                        processing={processing}
                        markDirty={() => setState('dirty')}
                        markPristine={() => setState('clean')}
                    >
                        <SettingsPage
                            title="Profil"
                            description="Nom, e-mail et téléphone +213 pour cette connexion EvoCrm."
                        >
                            {state === 'success' ? (
                                <p role="status" className="text-[13px] text-[var(--evo-success)]">
                                    {settingsCopy.saved}
                                </p>
                            ) : null}

                            <Form {...form}>
                                <form
                                    className="grid gap-3"
                                    onSubmit={form.handleSubmit(() => setState('success'))}
                                >
                                    <SettingsSection title="Informations personnelles" required>
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <SettingsRow label="Nom" htmlFor="lab-name" required>
                                                        <FormControl>
                                                            <Input id="lab-name" size="sm" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </SettingsRow>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <SettingsRow
                                                        label="E-mail"
                                                        htmlFor="lab-email"
                                                        required
                                                        error={form.formState.errors.email?.message}
                                                    >
                                                        <FormControl>
                                                            <Input
                                                                id="lab-email"
                                                                type="email"
                                                                size="sm"
                                                                error={state === 'error'}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </SettingsRow>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <SettingsRow label="Téléphone" htmlFor="lab-phone">
                                                        <FormControl>
                                                            <PhoneInput
                                                                id="lab-phone"
                                                                value={field.value}
                                                                onValueChange={(value) =>
                                                                    field.onChange(value ?? '')
                                                                }
                                                            />
                                                        </FormControl>
                                                    </SettingsRow>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="quota"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <SettingsRow label="Objectif" htmlFor="lab-quota">
                                                        <FormControl>
                                                            <MoneyInput
                                                                id="lab-quota"
                                                                value={field.value}
                                                                onValueChange={(value) =>
                                                                    field.onChange(value ?? 0)
                                                                }
                                                            />
                                                        </FormControl>
                                                    </SettingsRow>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="start"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <SettingsRow label="Début" htmlFor="lab-start">
                                                        <FormControl>
                                                            <TimePicker
                                                                id="lab-start"
                                                                value={field.value}
                                                                onValueChange={(value) =>
                                                                    field.onChange(value ?? '')
                                                                }
                                                            />
                                                        </FormControl>
                                                    </SettingsRow>
                                                </FormItem>
                                            )}
                                        />
                                        <SettingsRow label="Semaine" htmlFor="lab-week">
                                            <NativeSelect id="lab-week" defaultValue="6" className="h-8">
                                                {settingsCopy.weekdays.map((day) => (
                                                    <option key={day.value} value={day.value}>
                                                        {day.label}
                                                    </option>
                                                ))}
                                            </NativeSelect>
                                        </SettingsRow>
                                    </SettingsSection>

                                    <SettingsSaveBar
                                        dirty={dirty}
                                        processing={processing}
                                        visible={dirty || processing || state === 'success'}
                                    />
                                </form>
                            </Form>

                            {state === 'danger' ? (
                                <SettingsDangerZone
                                    title="Supprimer le compte"
                                    description="Supprime ce login et toutes ses ressources."
                                    actionLabel="Supprimer le compte"
                                    confirmTitle="Supprimer le compte ?"
                                    confirmDescription="Une fois supprimé, le compte et ses données disparaissent."
                                    triggerTestId="lab-delete-user"
                                />
                            ) : (
                                <SettingsEmptyState
                                    icon={<Warning className="size-6" />}
                                    title="Rien de connecté"
                                    description="Les connecteurs Meta, Google et Evolution apparaissent ici après authentification."
                                />
                            )}
                        </SettingsPage>
                    </SettingsFormProvider>
                </div>
            </div>
        </div>
    );
}
