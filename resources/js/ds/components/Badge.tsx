import { Slot } from '@radix-ui/react-slot';
import type { VariantProps } from 'class-variance-authority';
import * as React from 'react';

import type { BadgeProps } from '@/evo/ui/badge';
import { Badge as EvoBadge, badgeVariants } from '@/evo/ui/badge';
import { cn } from '@/lib/utils';

function Badge({
    className,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<'span'> &
    VariantProps<typeof badgeVariants> & {
        asChild?: boolean;
        variant?: BadgeProps['variant'];
    }) {
    if (asChild) {
        return (
            <Slot
                data-slot="badge"
                className={cn(badgeVariants({ variant }), className)}
                {...props}
            />
        );
    }

    return <EvoBadge data-slot="badge" variant={variant} className={className} {...props} />;
}

export { Badge, badgeVariants };
