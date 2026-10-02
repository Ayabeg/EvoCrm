import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import * as React from 'react';

import type { ButtonProps } from '@/evo/ui/button';
import { Button as CanonicalButton, buttonVariants as evoButtonVariants } from '@/evo/ui/button';

/** Compatibility export for legacy tailwind composition. */
const buttonVariants = cva('evo-btn', {
    variants: {
        variant: {
            default: '',
            destructive: '',
            outline: '',
            secondary: '',
            ghost: '',
            link: '',
        },
        size: {
            default: '',
            sm: '',
            lg: '',
            icon: '',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});

const Button = React.forwardRef<HTMLButtonElement, ButtonProps & VariantProps<typeof buttonVariants>>(
    function Button(props, ref) {
        return <CanonicalButton ref={ref} data-slot="button" {...props} />;
    },
);

export { Button, buttonVariants, evoButtonVariants };
