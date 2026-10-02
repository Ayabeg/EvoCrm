import { useEffect, useState  } from 'react';
import type {ReactNode} from 'react';
import type { DateRange } from 'react-day-picker';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Moon, Plus, Sun } from '@/evo/icons';
import { formatMoney } from '@/evo/lib/format';
import { EmptyState } from '@/evo/patterns/empty-state';
import { ErrorState } from '@/evo/patterns/error-state';
import { Alert, AlertDescription, AlertTitle } from '@/evo/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/evo/ui/alert-dialog';
import { Avatar } from '@/evo/ui/avatar';
import { Badge } from '@/evo/ui/badge';
import { BotAvatar } from '@/evo/ui/bot-avatar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/evo/ui/breadcrumb';
import { Button } from '@/evo/ui/button';
import { ButtonGroup } from '@/evo/ui/button-group';
import { Callout } from '@/evo/ui/callout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/evo/ui/card';
import { Checkbox } from '@/evo/ui/checkbox';
import { Combobox } from '@/evo/ui/combobox';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/evo/ui/context-menu';
import { DatePicker } from '@/evo/ui/date-picker';
import { DateRangePicker } from '@/evo/ui/date-range-picker';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/evo/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/evo/ui/drawer';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/evo/ui/dropdown-menu';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    evoZodResolver,
} from '@/evo/ui/form';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/evo/ui/hover-card';
import { IconButton } from '@/evo/ui/icon-button';
import { Input } from '@/evo/ui/input';
import { Kbd, KbdGroup } from '@/evo/ui/kbd';
import { Label } from '@/evo/ui/label';
import { MoneyInput } from '@/evo/ui/money-input';
import { MultiSelect } from '@/evo/ui/multi-select';
import { NumberInput } from '@/evo/ui/number-input';
import { Panel } from '@/evo/ui/panel';
import { PhoneInput } from '@/evo/ui/phone-input';
import { Progress } from '@/evo/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/evo/ui/radio-group';
import { RecordPicker } from '@/evo/ui/record-picker';
import { SearchInput } from '@/evo/ui/search-input';
import { SegmentedControl, SegmentedControlItem } from '@/evo/ui/segmented-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/evo/ui/select';
import { Separator } from '@/evo/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/evo/ui/sheet';
import { Skeleton, SkeletonRow } from '@/evo/ui/skeleton';
import { Spinner } from '@/evo/ui/spinner';
import { SplitButton } from '@/evo/ui/split-button';
import { Status } from '@/evo/ui/status';
import { Switch } from '@/evo/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/evo/ui/tabs';
import { TagInput } from '@/evo/ui/tag-input';
import { Textarea } from '@/evo/ui/textarea';
import { TimePicker } from '@/evo/ui/time-picker';
import { toast } from '@/evo/ui/toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/evo/ui/tooltip';

const CLINICS = [
    { value: 'clinique-el-djazair', label: 'Clinique El Djazair' },
    { value: 'hopital-ibn-sina', label: 'Hôpital Ibn Sina' },
    { value: 'cabinet-dr-amrani', label: 'Cabinet Dr. Amrani' },
    { value: 'pharmacie-centrale', label: 'Pharmacie Centrale' },
];

const formSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
});

function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
}

function readThemeParam(): 'light' | 'dark' {
    if (typeof window === 'undefined') {
        return 'light';
    }

    return new URLSearchParams(window.location.search).get('theme') === 'dark' ? 'dark' : 'light';
}

function readOverlay(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    return new URLSearchParams(window.location.search).get('overlay');
}

function Section({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section id={id} className="mt-10 scroll-mt-8">
            <h2 className="text-[16px] font-semibold">{title}</h2>
            <div className="mt-3 flex flex-col gap-4">{children}</div>
        </section>
    );
}

function StateRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid gap-3 md:grid-cols-[9rem_1fr] md:items-center">
            <p className="text-[12px] text-[var(--evo-ink-muted)]">{label}</p>
            <div className="flex flex-wrap items-center gap-2">{children}</div>
        </div>
    );
}

export function ComponentsPage() {
    const [theme, setTheme] = useState<'light' | 'dark'>(readThemeParam);
    const overlay = readOverlay();
    const [dialogOpen, setDialogOpen] = useState(overlay === 'dialog');
    const [sheetOpen, setSheetOpen] = useState(overlay === 'sheet');
    const [date, setDate] = useState<Date | undefined>(new Date('2026-09-15'));
    const [range, setRange] = useState<DateRange | undefined>({
        from: new Date('2026-09-01'),
        to: new Date('2026-09-30'),
    });
    const [clinic, setClinic] = useState<string | null>(overlay === 'combobox' ? 'clinique-el-djazair' : null);
    const [multi, setMulti] = useState<string[]>(['clinique-el-djazair']);
    const [tags, setTags] = useState<string[]>(['Santé', 'Alger']);
    const [phone, setPhone] = useState<string | null>('+213551234567');
    const [money, setMoney] = useState<number | null>(1_280_000);
    const [qty, setQty] = useState<number | null>(12);
    const [time, setTime] = useState<string | null>('14:30');
    const [segment, setSegment] = useState('liste');
    const [checked, setChecked] = useState(true);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: evoZodResolver(formSchema),
        defaultValues: { name: '', email: 'pas-un-email' },
        mode: 'onChange',
    });

    useEffect(() => {
        applyTheme(theme);
        void form.trigger();
    }, [form, theme]);

    return (
        <TooltipProvider>
            <div className="mx-auto max-w-[1120px] pb-16" data-lab="components">
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--evo-hairline)] pb-5">
                    <div>
                        <p className="text-[12px] text-[var(--evo-ink-muted)]">Système de design · PR3</p>
                        <h1 className="mt-1 text-[length:var(--evo-text-24)] leading-none font-semibold tracking-[-0.03em]">
                            Composants
                        </h1>
                        <p className="mt-2 max-w-[46rem] text-[13px] text-[var(--evo-ink-muted)]">
                            Surface de régression des primitifs Evo. Contrôles 32 / 36, échelle 11–32,
                            focus sarcelle, primaire orange var(--evo-primary) avec libellé var(--evo-on-primary). FileDropzone
                            et RichTextEditor sont différés.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
                    >
                        {theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                        {theme === 'dark' ? 'Claire' : 'Cabinet'}
                    </Button>
                </header>

                <Section id="buttons" title="Boutons">
                    <StateRow label="Défaut">
                        <Button>Créer un contact</Button>
                        <Button variant="outline">Secondaire</Button>
                        <Button variant="ghost">Fantôme</Button>
                        <Button variant="destructive">Supprimer</Button>
                    </StateRow>
                    <StateRow label="Compact / désactivé / chargement">
                        <Button size="sm">Compact 32</Button>
                        <Button disabled>Désactivé</Button>
                        <Button loading>Chargement</Button>
                        <IconButton label="Ajouter">
                            <Plus className="size-4" />
                        </IconButton>
                    </StateRow>
                    <StateRow label="Groupe / scindé">
                        <ButtonGroup>
                            <Button variant="outline">Note</Button>
                            <Button variant="outline">E-mail</Button>
                            <Button variant="outline" aria-pressed>
                                Appel
                            </Button>
                        </ButtonGroup>
                        <SplitButton
                            menu={<DropdownMenuItem>Exporter CSV</DropdownMenuItem>}
                            onClick={() => toast.success('Contact créé')}
                        >
                            Enregistrer
                        </SplitButton>
                    </StateRow>
                    <StateRow label="Contenu long">
                        <Button>
                            Créer une affaire pour Clinique El Djazair — modernisation CRM septembre
                        </Button>
                    </StateRow>
                </Section>

                <Section id="inputs" title="Champs">
                    <StateRow label="Défaut / erreur / désactivé">
                        <Input placeholder="Nom" defaultValue="Amine Benali" aria-label="Nom" />
                        <Input error placeholder="Erreur" aria-label="Champ en erreur" />
                        <Input disabled placeholder="Désactivé" aria-label="Désactivé" />
                    </StateRow>
                    <StateRow label="Recherche / nombre / montant">
                        <SearchInput placeholder="Rechercher une clinique…" aria-label="Recherche" />
                        <NumberInput value={qty} onValueChange={setQty} aria-label="Quantité" />
                        <MoneyInput value={money} onValueChange={setMoney} />
                    </StateRow>
                    <StateRow label="Téléphone +213 / textarea">
                        <PhoneInput value={phone} onValueChange={setPhone} />
                        <Textarea
                            defaultValue="Note interne : relancer Hôpital Ibn Sina avant vendredi."
                            aria-label="Note"
                            className="min-w-72"
                        />
                    </StateRow>
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">
                        Montant formaté : {money == null ? '—' : formatMoney(money)}
                    </p>
                </Section>

                <Section id="selects" title="Sélection">
                    <StateRow label="Select / combobox">
                        <div className="w-64">
                            <Select defaultValue="clinique-el-djazair">
                                <SelectTrigger aria-label="Société">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CLINICS.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-64" data-lab="combobox">
                            <Combobox
                                options={CLINICS}
                                value={clinic}
                                onValueChange={setClinic}
                                placeholder="Choisir une société…"
                                defaultOpen={overlay === 'combobox'}
                            />
                        </div>
                    </StateRow>
                    <StateRow label="Multi / tags / record">
                        <div className="w-72">
                            <MultiSelect options={CLINICS} value={multi} onValueChange={setMulti} />
                        </div>
                        <div className="w-72">
                            <TagInput value={tags} onValueChange={setTags} />
                        </div>
                        <div className="w-72">
                            <RecordPicker
                                options={CLINICS.map((item) => ({
                                    ...item,
                                    kind: 'company' as const,
                                    meta: 'Alger',
                                }))}
                                value={clinic}
                                onValueChange={setClinic}
                            />
                        </div>
                    </StateRow>
                </Section>

                <Section id="toggles" title="Cases, radios, interrupteurs">
                    <StateRow label="Checkbox">
                        <Checkbox checked={checked} onCheckedChange={setChecked}>
                            Actif
                        </Checkbox>
                        <Checkbox indeterminate>Partiel</Checkbox>
                        <Checkbox disabled>Désactivé</Checkbox>
                    </StateRow>
                    <StateRow label="Radio / switch / segmented">
                        <RadioGroup defaultValue="ouvert" className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="ouvert" id="st-open" />
                                <Label htmlFor="st-open">Ouvert</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="gagne" id="st-won" />
                                <Label htmlFor="st-won">Gagné</Label>
                            </div>
                        </RadioGroup>
                        <Switch aria-label="Notifications" defaultChecked />
                        <SegmentedControl
                            type="single"
                            value={segment}
                            onValueChange={(value) => value && setSegment(value)}
                        >
                            <SegmentedControlItem value="liste">Liste</SegmentedControlItem>
                            <SegmentedControlItem value="kanban">Kanban</SegmentedControlItem>
                        </SegmentedControl>
                    </StateRow>
                </Section>

                <Section id="dates" title="Dates et heure (semaine samedi, 24 h)">
                    <StateRow label="Date / période / heure">
                        <div className="w-56">
                            <DatePicker value={date} onValueChange={setDate} />
                        </div>
                        <div className="w-72" data-lab="date-range">
                            <DateRangePicker
                                value={range}
                                onValueChange={setRange}
                                defaultOpen={overlay === 'date-range'}
                            />
                        </div>
                        <div className="w-52" data-lab="time-picker">
                            <TimePicker value={time} onValueChange={setTime} />
                        </div>
                    </StateRow>
                </Section>

                <Section id="feedback" title="Badges, statuts, alertes">
                    <StateRow label="Badge / statut">
                        <Badge>Neutre</Badge>
                        <Badge variant="destructive">Erreur</Badge>
                        <Badge tone="success" fill="soft">
                            Gagné
                        </Badge>
                        <Status tone="success" label="Actif" />
                        <Status tone="warn" label="En attente" />
                    </StateRow>
                    <StateRow label="Avatar">
                        <Avatar initials="AB" alt="Amine Benali" />
                        <BotAvatar name="Evo" />
                    </StateRow>
                    <Alert>
                        <AlertTitle>Relance prévue</AlertTitle>
                        <AlertDescription>
                            Cabinet Dr. Amrani n’a pas répondu depuis 6 jours.
                        </AlertDescription>
                    </Alert>
                    <Alert variant="destructive">
                        <AlertTitle>Export interrompu</AlertTitle>
                        <AlertDescription>Le fichier CSV n’a pas pu être généré.</AlertDescription>
                    </Alert>
                    <Callout variant="info" title="Sarcelle = focus">
                        L’orange n’agit que pour une action volontaire.
                    </Callout>
                </Section>

                <Section id="chrome" title="Structure">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#/">Accueil</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Composants</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <Tabs defaultValue="societes">
                        <TabsList>
                            <TabsTrigger value="societes">Sociétés</TabsTrigger>
                            <TabsTrigger value="contacts">Contacts</TabsTrigger>
                        </TabsList>
                        <TabsContent value="societes">Clinique El Djazair, Hôpital Ibn Sina</TabsContent>
                        <TabsContent value="contacts">Amine Benali, Lina Haddad</TabsContent>
                    </Tabs>
                    <Separator />
                    <div className="grid gap-3 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Carte</CardTitle>
                                <CardDescription>Surface standard</CardDescription>
                            </CardHeader>
                            <CardContent>Pharmacie Centrale — Alger</CardContent>
                        </Card>
                        <Panel>
                            <CardHeader>
                                <CardTitle>Panneau</CardTitle>
                                <CardDescription>Surface élevée</CardDescription>
                            </CardHeader>
                            <CardContent>Cabinet Dr. Amrani — Blida</CardContent>
                        </Panel>
                    </div>
                </Section>

                <Section id="overlays" title="Calques">
                    <StateRow label="Dialog / sheet / drawer">
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" data-lab="open-dialog">
                                    Ouvrir le dialogue
                                </Button>
                            </DialogTrigger>
                            <DialogContent data-lab="dialog">
                                <DialogHeader>
                                    <DialogTitle>Créer un contact</DialogTitle>
                                    <DialogDescription>
                                        Les champs sont en français. Le piège à focus reste actif.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogBody>
                                    <Input placeholder="Nom complet" aria-label="Nom complet" />
                                </DialogBody>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                        Annuler
                                    </Button>
                                    <Button onClick={() => setDialogOpen(false)}>Enregistrer</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" data-lab="open-sheet">
                                    Ouvrir le panneau
                                </Button>
                            </SheetTrigger>
                            <SheetContent data-lab="sheet">
                                <SheetHeader>
                                    <SheetTitle>Fiche société</SheetTitle>
                                    <SheetDescription>Clinique El Djazair — Alger</SheetDescription>
                                </SheetHeader>
                            </SheetContent>
                        </Sheet>
                        <Drawer>
                            <DrawerTrigger asChild>
                                <Button variant="outline">Tiroir</Button>
                            </DrawerTrigger>
                            <DrawerContent>
                                <DrawerHeader>
                                    <DrawerTitle>Filtres</DrawerTitle>
                                    <DrawerDescription>Deux niveaux seulement (ET / OU).</DrawerDescription>
                                </DrawerHeader>
                            </DrawerContent>
                        </Drawer>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Confirmer</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer le contact ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action est irréversible.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction>Supprimer</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </StateRow>
                    <StateRow label="Menus / infobulle">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">Menu</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>Modifier</DropdownMenuItem>
                                <DropdownMenuItem>Archiver</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <HoverCard>
                            <HoverCardTrigger asChild>
                                <Button variant="ghost">Survol</Button>
                            </HoverCardTrigger>
                            <HoverCardContent>Hôpital Ibn Sina — pipeline ouvert.</HoverCardContent>
                        </HoverCard>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost">Infobulle</Button>
                            </TooltipTrigger>
                            <TooltipContent>Raccourci : {''}
                                <KbdGroup>
                                    <Kbd>⌘</Kbd>
                                    <Kbd>K</Kbd>
                                </KbdGroup>
                            </TooltipContent>
                        </Tooltip>
                        <ContextMenu>
                            <ContextMenuTrigger asChild>
                                <Button variant="outline">Clic droit</Button>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                                <ContextMenuItem>Ouvrir</ContextMenuItem>
                                <ContextMenuItem>Copier le lien</ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                        <Button variant="outline" onClick={() => toast.message('Notification sonner')}>
                            Toast
                        </Button>
                    </StateRow>
                </Section>

                <Section id="states" title="États vides, erreur, chargement">
                    <div className="grid gap-3 md:grid-cols-3">
                        <Card>
                            <EmptyState
                                density="panel"
                                title="Aucun contact"
                                description="Aucun enregistrement pour Clinique El Djazair."
                            />
                        </Card>
                        <Card>
                            <ErrorState density="panel" onRetry={() => undefined} />
                        </Card>
                        <Card className="p-4">
                            <div className="flex flex-col gap-2">
                                <Spinner />
                                <Skeleton className="h-4 w-40" />
                                <SkeletonRow />
                                <Progress value={42} />
                            </div>
                        </Card>
                    </div>
                </Section>

                <Section id="form" title="Formulaire (react-hook-form + zod, messages FR)">
                    <Form {...form}>
                        <form className="grid max-w-md gap-3" onSubmit={form.handleSubmit(() => toast.success('Valide'))}>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormDescription>Nom affiché sur la fiche.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit">Valider</Button>
                        </form>
                    </Form>
                </Section>
            </div>
        </TooltipProvider>
    );
}
