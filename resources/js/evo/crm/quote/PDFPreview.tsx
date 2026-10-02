/**
 * Evo Design System — PDFPreview
 * Registry: custom Evo
 * License: MIT (original)
 */

import { FileText } from '@/evo/icons';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';

export function PDFPreview({
    href,
    label = 'Preview PDF',
}: {
    href: string;
    label?: string;
}) {
    return (
        <Button asChild variant="outline" size="sm">
            <a href={href} target="_blank" rel="noreferrer">
                <FileText className="size-3.5" aria-hidden />
                {t(label)}
            </a>
        </Button>
    );
}
