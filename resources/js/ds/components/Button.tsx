import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { Button as AuroraButton } from '@/components/ui/aurora/button';
import {
    mapButtonSize,
    mapButtonVariant,
    type ShadcnButtonSize,
    type ShadcnButtonVariant,
} from '@/lib/aurora/shadcn-bridge';
import { cn } from '@/lib/utils';

/** Compatibility export for legacy tailwind composition. */
const buttonVariants = cva('aurora-btn', {
    variants: {
        variant: {
            default: 'aurora-btn--aurora aurora-btn--filled',
            destructive: 'aurora-btn--destructive aurora-btn--filled',
            outline: 'aurora-btn--neutral',
            secondary: 'aurora-btn--neutral',
            ghost: 'aurora-btn--ghost',
            link: 'aurora-btn--plain',
        },
        size: {
            default: '',
            sm: 'aurora-btn--sm',
            lg: 'aurora-btn--lg',
            icon: 'aurora-btn--icon',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});

function Button({
    className,
    variant,
    size,
    asChild = false,
    shape,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
        variant?: ShadcnButtonVariant;
        size?: ShadcnButtonSize;
        shape?: 'default' | 'pill';
    }) {
    const mapped = mapButtonVariant(variant);

    return (
        <AuroraButton
            data-slot="button"
            variant={mapped.variant}
            filled={mapped.filled}
            size={mapButtonSize(size)}
            asChild={asChild}
            shape={shape}
            className={cn(className)}
            {...props}
        />
    );
}

export { Button, buttonVariants };
