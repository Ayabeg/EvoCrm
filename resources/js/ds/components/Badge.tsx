import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { Badge as AuroraBadge } from '@/components/ui/aurora/badge';
import {
    mapBadgeVariant,
    type ShadcnBadgeVariant,
} from '@/lib/aurora/shadcn-bridge';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex', {
    variants: {
        variant: {
            default: '',
            secondary: '',
            destructive: '',
            outline: '',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});

function Badge({
    className,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<'span'> &
    VariantProps<typeof badgeVariants> & {
        asChild?: boolean;
        variant?: ShadcnBadgeVariant;
    }) {
    const mapped = mapBadgeVariant(variant);

    if (asChild) {
        return (
            <Slot
                data-slot="badge"
                className={cn(badgeVariants({ variant }), className)}
                {...props}
            />
        );
    }

    return (
        <AuroraBadge
            data-slot="badge"
            tone={mapped.tone}
            fill={mapped.fill}
            className={cn(className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
