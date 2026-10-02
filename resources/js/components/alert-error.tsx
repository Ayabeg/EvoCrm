import { WarningCircle } from '@phosphor-icons/react';
import { Callout } from '@/evo/ui/callout';

/**
 * Product form-error surface.
 * Uses Aurora Callout (error) as the status primitive. The local Alert
 * wrapper remains for compound shadcn call sites that are not form errors.
 */
export default function AlertError({
    errors,
    title,
}: {
    errors: string[];
    title?: string;
}) {
    return (
        <Callout
            variant="error"
            title={title || 'Something went wrong.'}
            icon={<WarningCircle className="size-4" weight="regular" aria-hidden />}
        >
            <ul className="list-inside list-disc text-sm">
                {Array.from(new Set(errors)).map((error, index) => (
                    <li key={index}>{error}</li>
                ))}
            </ul>
        </Callout>
    );
}
