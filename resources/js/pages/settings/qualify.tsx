import { Form, Head } from '@inertiajs/react';
import {
    SettingsCard,
    SettingsFormRow,
    SettingsPageHeader,
    SettingsSaveBar,
} from '@/components/settings/chrome';
import { Input } from '@/components/ui/input';

type Thresholds = {
    hold: number;
    qualify: number;
    convert: number;
};

export default function QualifySettings({
    thresholds,
    canManage,
}: {
    thresholds: Thresholds;
    canManage: boolean;
}) {
    return (
        <>
            <Head title="Qualify" />

            <SettingsPageHeader
                title="Qualify"
                description="Formula lead score thresholds. Crossing qualify marks the lead. Crossing convert uses the existing convert path."
            />

            <Form action="/settings/qualify" method="put">
                {({ processing }) => (
                    <SettingsCard
                        title="Score thresholds"
                        required
                        footer={
                            canManage ? (
                                <SettingsSaveBar
                                    processing={processing}
                                    saveLabel="Save thresholds"
                                />
                            ) : undefined
                        }
                    >
                        <SettingsFormRow label="Hold" htmlFor="hold" required>
                            <Input
                                id="hold"
                                name="hold"
                                type="number"
                                min={0}
                                max={100}
                                defaultValue={thresholds.hold}
                                className="h-8"
                                disabled={!canManage}
                            />
                        </SettingsFormRow>
                        <SettingsFormRow
                            label="Qualify"
                            htmlFor="qualify"
                            required
                        >
                            <Input
                                id="qualify"
                                name="qualify"
                                type="number"
                                min={0}
                                max={100}
                                defaultValue={thresholds.qualify}
                                className="h-8"
                                disabled={!canManage}
                            />
                        </SettingsFormRow>
                        <SettingsFormRow
                            label="Convert"
                            htmlFor="convert"
                            required
                        >
                            <Input
                                id="convert"
                                name="convert"
                                type="number"
                                min={0}
                                max={100}
                                defaultValue={thresholds.convert}
                                className="h-8"
                                disabled={!canManage}
                            />
                        </SettingsFormRow>
                        <p className="text-[12px] text-mute">
                            Hold moves new leads to working. Qualify sets
                            qualified. Convert creates or links the unique deal.
                        </p>
                    </SettingsCard>
                )}
            </Form>
        </>
    );
}
