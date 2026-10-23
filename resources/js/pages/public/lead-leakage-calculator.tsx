import { Head, Link, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';

type Inputs = {
    submission_key: string;
    monthly_inquiries: string;
    average_customer_value: string;
    inquiry_to_customer_rate: string;
    missed_inquiry_rate: string;
    delayed_response_rate: string;
    follow_up_dropoff_rate: string;
    name: string;
    email: string;
    company: string;
    marketing_consent: boolean;
    enrichment_consent: boolean;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
};

type Calculation = {
    version: string;
    monthly_inquiries: number;
    total_lost_inquiries: number;
    leakage_rate_percent: number;
    expected_customers_lost: number;
    estimated_revenue_at_risk: number;
    estimated_revenue_retained_after_process_improvement: number;
};

function submissionKey(): string {
    return crypto.randomUUID();
}

function initialInputs(): Inputs {
    return {
        submission_key: submissionKey(),
        monthly_inquiries: '40',
        average_customer_value: '50000',
        inquiry_to_customer_rate: '20',
        missed_inquiry_rate: '10',
        delayed_response_rate: '15',
        follow_up_dropoff_rate: '20',
        name: '',
        email: '',
        company: '',
        marketing_consent: false,
        enrichment_consent: false,
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
    };
}

function currency(value: number): string {
    return new Intl.NumberFormat('fr-DZ', {
        style: 'currency',
        currency: 'DZD',
        maximumFractionDigits: 2,
    }).format(value);
}

export default function LeadLeakageCalculator({
    workspace,
    offer,
    result,
    submission,
}: {
    workspace: { name: string; slug: string };
    offer: { slug: string; name: string; version: string; description: string | null; demo_url: string | null };
    result: Calculation | null;
    submission: {
        id: number;
        contact_created: boolean;
        marketing_consent_recorded: boolean;
        enrichment_queued: boolean;
        delivery_status: string;
        booking_url: string | null;
    } | null;
}) {
    const form = useForm<Inputs>(initialInputs);
    const [showResult, setShowResult] = useState(Boolean(result));

    const formStarted = useRef(false);
    const trackFormStart = () => {
        if (formStarted.current) {
            return;
        }

        formStarted.current = true;
        void fetch(`/lead-magnet/${workspace.slug}/${offer.slug}/track?event=form_started`, {
            credentials: 'same-origin',
            keepalive: true,
        }).catch(() => undefined);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(`/lead-magnet/${workspace.slug}/${offer.slug}`, {
            preserveScroll: true,
            onSuccess: () => {
                form.setData('submission_key', submissionKey());
                setShowResult(true);
            },
        });
    };

    const resetForm = () => {
        form.clearErrors();
        form.setData(initialInputs());
        setShowResult(false);
    };

    const error = (field: keyof Inputs): string | undefined => form.errors[field];

    return (
        <>
            <Head title={offer.name} />
            <main className="mx-auto min-h-[100dvh] max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/" className="text-sm font-semibold tracking-tight text-ink">
                        EvoCrm
                    </Link>
                    <Link href="/privacy" className="text-xs text-mute underline underline-offset-2">
                        Privacy
                    </Link>
                </div>

                <section className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                    <div>
                        <p className="text-xs font-medium tracking-[0.18em] text-accent uppercase">
                            Free operational estimate
                        </p>
                        <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
                            See what missed inquiries may be costing your clinic.
                        </h1>
                        <p className="mt-5 max-w-xl text-base leading-7 text-mute">
                            {offer.description ?? 'Estimate the value of inquiries lost through missed responses and inconsistent follow-up.'}
                            {' '}Use your own numbers. The calculator shows the assumptions and does not use industry averages or guarantees.
                        </p>
                        <div className="mt-8 space-y-3 text-sm text-ink">
                            <p>✓ See leakage stage by stage.</p>
                            <p>✓ Keep the estimate based on your own clinic data.</p>
                            <p>✓ Get a useful result without submitting contact details.</p>
                        </div>
                    </div>

                    <form onFocus={trackFormStart} onSubmit={submit} className="space-y-5 rounded-2xl border border-hairline bg-surface p-5 shadow-sm sm:p-7">
                        <div>
                            <h2 className="text-lg font-semibold text-ink">Your assumptions</h2>
                            <p className="mt-1 text-xs leading-5 text-mute">Percentages are applied sequentially to avoid double-counting the same inquiry.</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Monthly inquiries" name="monthly_inquiries" value={form.data.monthly_inquiries} onChange={(value) => form.setData('monthly_inquiries', value)} error={error('monthly_inquiries')} />
                            <Field label="Average customer value (DZD)" name="average_customer_value" value={form.data.average_customer_value} onChange={(value) => form.setData('average_customer_value', value)} error={error('average_customer_value')} />
                            <Field label="Inquiry-to-customer rate (%)" name="inquiry_to_customer_rate" value={form.data.inquiry_to_customer_rate} onChange={(value) => form.setData('inquiry_to_customer_rate', value)} error={error('inquiry_to_customer_rate')} />
                            <Field label="Missed inquiries (%)" name="missed_inquiry_rate" value={form.data.missed_inquiry_rate} onChange={(value) => form.setData('missed_inquiry_rate', value)} error={error('missed_inquiry_rate')} />
                            <Field label="Delayed responses (%)" name="delayed_response_rate" value={form.data.delayed_response_rate} onChange={(value) => form.setData('delayed_response_rate', value)} error={error('delayed_response_rate')} />
                            <Field label="Follow-up drop-off (%)" name="follow_up_dropoff_rate" value={form.data.follow_up_dropoff_rate} onChange={(value) => form.setData('follow_up_dropoff_rate', value)} error={error('follow_up_dropoff_rate')} />
                        </div>

                        <div className="border-t border-hairline pt-5">
                            <p className="text-sm font-medium text-ink">Optional: share this result with EvoCrm</p>
                            <p className="mt-1 text-xs leading-5 text-mute">This does not subscribe you to marketing. Marketing consent is a separate choice.</p>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <Field label="Name" name="name" type="text" value={form.data.name} onChange={(value) => form.setData('name', value)} error={error('name')} required={false} />
                                <Field label="Business email" name="email" type="email" value={form.data.email} onChange={(value) => form.setData('email', value)} error={error('email')} required={false} />
                                <Field label="Clinic or business" name="company" type="text" value={form.data.company} onChange={(value) => form.setData('company', value)} error={error('company')} required={false} />
                            </div>
                            <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-mute">
                                <input
                                    type="checkbox"
                                    checked={form.data.marketing_consent}
                                    onChange={(event) => form.setData('marketing_consent', event.target.checked)}
                                    className="mt-0.5 accent-[var(--evo-primary)]"
                                />
                                <span>I want to receive relevant EvoCrm updates by email.</span>
                            </label>
                            <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-mute">
                                <input
                                    type="checkbox"
                                    checked={form.data.enrichment_consent}
                                    onChange={(event) => form.setData('enrichment_consent', event.target.checked)}
                                    className="mt-0.5 accent-[var(--evo-primary)]"
                                />
                                <span>I allow EvoCrm to enrich this business record with relevant public business information for a more useful follow-up.</span>
                            </label>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            <Button type="button" variant="outline" disabled={form.processing} onClick={resetForm}>
                                Reset inputs
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Calculating…' : 'Calculate my estimate'}
                            </Button>
                        </div>
                        <p className="text-center text-[11px] leading-4 text-mute">Estimate only. Your inputs are assumptions, not measured results.</p>
                    </form>
                </section>

                {showResult && result ? (
                    <section className="mt-10 rounded-2xl border border-accent/30 bg-accent/5 p-5 sm:p-7" aria-live="polite">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-medium tracking-[0.18em] text-accent uppercase">Your estimate</p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Potential value at risk: {currency(result.estimated_revenue_at_risk)}</h2>
                            </div>
                            <span className="rounded-full border border-hairline bg-surface px-3 py-1 text-xs text-mute">{result.version}</span>
                        </div>
                        <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            <Metric label="Inquiries lost" value={result.total_lost_inquiries.toLocaleString('fr-DZ')} />
                            <Metric label="Leakage rate" value={`${result.leakage_rate_percent}%`} />
                            <Metric label="Expected customers lost" value={result.expected_customers_lost.toLocaleString('fr-DZ')} />
                        </div>
                        <p className="mt-6 text-sm leading-6 text-mute">
                            This result applies your missed-inquiry, delayed-response, and follow-up assumptions in order. It is not a promise of savings or revenue; it is a transparent estimate to help you decide what to measure next.
                        </p>
                        {submission?.contact_created ? (
                            <p className="mt-4 text-sm text-ink">
                                Your result is linked to your EvoCrm record. {submission.marketing_consent_recorded ? 'Your separate marketing choice was recorded.' : 'No marketing subscription was added.'}
                            </p>
                        ) : null}
                        {submission?.enrichment_queued ? (
                            <p className="mt-2 text-sm text-mute">Relevant public business information will be checked in the background.</p>
                        ) : null}
                        {submission?.delivery_status === 'queued' || submission?.delivery_status === 'sending' ? (
                            <p className="mt-2 text-sm text-mute">A copy is queued for the email address you provided.</p>
                        ) : null}
                        {submission?.delivery_status === 'accepted' ? (
                            <p className="mt-2 text-sm text-mute">The configured mailer accepted a copy for sending. Inbox delivery depends on your email provider.</p>
                        ) : null}
                        {submission?.delivery_status === 'failed' ? (
                            <p className="mt-2 text-sm text-red-700">We could not queue the email copy. Your result is still available above; no marketing subscription was added because of this error.</p>
                        ) : null}
                        {offer.demo_url ? (
                            <a
                                href={submission?.booking_url ?? offer.demo_url}
                                className="mt-6 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
                            >
                                Request a personalized EvoCrm demo
                            </a>
                        ) : null}
                    </section>
                ) : null}
            </main>
        </>
    );
}

function Field({
    label,
    name,
    value,
    onChange,
    error,
    type = 'number',
    required = true,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
    required?: boolean;
}) {
    return (
        <div>
            <Label htmlFor={`lead-leakage-${name}`}>{label}</Label>
            <Input id={`lead-leakage-${name}`} name={name} type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="mt-1.5" />
            {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-hairline bg-surface p-4">
            <p className="text-xs text-mute">{label}</p>
            <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
        </div>
    );
}
