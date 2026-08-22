import { Head } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';

export default function SequenceShow({ sequence }: { sequence: any }) {
    return (
        <>
            <Head title={sequence.name} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader title={sequence.name} description={`Channel: ${sequence.channel}`} />
                <Card className="space-y-2 p-4 text-sm">
                    {(sequence.steps ?? []).map((step: any) => (
                        <p key={step.id}>
                            Step {step.position} · +{step.delay_hours}h · {step.channel}
                            {step.wa_template_name ? ` · template ${step.wa_template_name}` : ''}
                            {step.subject ? ` · ${step.subject}` : ''}
                        </p>
                    ))}
                </Card>
            </div>
        </>
    );
}

SequenceShow.layout = {
    breadcrumbs: [
        { title: 'Sequences', href: '/outbound/sequences' },
        { title: 'Sequence', href: '#' },
    ],
};
