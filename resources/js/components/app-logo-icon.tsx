import { cn } from '@/lib/utils';

/**
 * EvoCrm product mark. Artwork fill is #E8530E — never recolor.
 */
export default function AppLogoIcon({
    className,
    alt = 'EvoCrm',
}: {
    className?: string;
    alt?: string;
}) {
    return (
        <img
            src="/brand/evocrm/logo.svg"
            alt={alt}
            className={cn('size-7 shrink-0', className)}
        />
    );
}
