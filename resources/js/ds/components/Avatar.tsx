/**
 * Product avatar wrapper. Canonical primitive is `@/evo/ui/avatar`.
 */
import * as React from 'react';
import {
    Avatar as EvoAvatar,
    AvatarFallback as EvoAvatarFallback,
    AvatarGroup,
    AvatarImage as EvoAvatarImage
    
} from '@/evo/ui/avatar';
import type {AvatarProps} from '@/evo/ui/avatar';

function isElement(
    child: React.ReactNode,
): child is React.ReactElement<Record<string, unknown>> {
    return React.isValidElement(child);
}

function Avatar({ className, children, ...props }: AvatarProps) {
    let src = props.src;
    let alt = props.alt ?? '';
    let initials = props.initials ?? props.fallback;

    React.Children.forEach(children, (child) => {
        if (!isElement(child)) {
            return;
        }

        if (child.type === AvatarImage) {
            src = (child.props.src as string | undefined) ?? src;
            alt = (child.props.alt as string | undefined) ?? alt;
        }

        if (child.type === AvatarFallback) {
            const label = child.props.children;

            if (typeof label === 'string' && label.length > 0) {
                initials = label;
            }
        }
    });

    return (
        <EvoAvatar
            {...props}
            src={src}
            alt={alt}
            initials={initials}
            fallback={initials}
            size={props.size ?? 'md'}
            className={className}
        />
    );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof EvoAvatarImage>) {
    return <EvoAvatarImage className={className} {...props} />;
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof EvoAvatarFallback>) {
    return <EvoAvatarFallback className={className} {...props} />;
}

export { Avatar, AvatarFallback, AvatarGroup, AvatarImage };
