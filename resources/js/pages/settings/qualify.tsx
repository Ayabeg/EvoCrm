import { Form, Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
            <div className="space-y-4">
                <Heading
                    title="Qualify"
                    description="Formula lead score thresholds. Crossing qualify marks the lead. Crossing convert uses the existing convert path."
                />
                <div className="space-y-3 border-t border-hairline pt-3">
                    <Form
                        action="/settings/qualify"
                        method="put"
                        className="grid gap-3 sm:grid-cols-3"
                    >
                        <div>
                            <Label htmlFor="hold">Hold</Label>
                            <Input
                                id="hold"
                                name="hold"
                                type="number"
                                min={0}
                                max={100}
                                defaultValue={thresholds.hold}
                                className="mt-1"
                                disabled={!canManage}
                            />
                        </div>
                        <div>
                            <Label htmlFor="qualify">Qualify</Label>
                            <Input
                                id="qualify"
                                name="qualify"
                                type="number"
                                min={0}
                                max={100}
                                defaultValue={thresholds.qualify}
                                className="mt-1"
                                disabled={!canManage}
                            />
                        </div>
                        <div>
                            <Label htmlFor="convert">Convert</Label>
                            <Input
                                id="convert"
                                name="convert"
                                type="number"
                                min={0}
                                max={100}
                                defaultValue={thresholds.convert}
                                className="mt-1"
                                disabled={!canManage}
                            />
                        </div>
                        {canManage ? (
                            <div className="sm:col-span-3">
                                <Button type="submit" size="sm">
                                    Save thresholds
                                </Button>
                            </div>
                        ) : null}
                    </Form>
                    <p className="text-xs text-mute">
                        Hold moves new leads to working. Qualify sets qualified.
                        Convert creates or links the unique deal.
                    </p>
                </div>
            </div>
        </>
    );
}
