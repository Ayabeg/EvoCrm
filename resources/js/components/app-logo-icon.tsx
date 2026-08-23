import { cn } from '@/lib/utils';

/**
 * Evotechly company mark. Artwork fill is #EC6025 — never recolor.
 */
export default function AppLogoIcon({
    className,
    alt = 'Evotechly',
}: {
    className?: string;
    alt?: string;
}) {
    return (
        <img
            src="/brand/evotechly/mark.svg"
            alt={alt}
            className={cn('size-7 shrink-0', className)}
        />
    );
}
