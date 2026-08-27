/**
 * Product avatar wrapper.
 *
 * Authority: Aurora (`ui/aurora/avatar`) owns the primitive — sizes, status,
 * tone, a11y. This file is the EvoSales compound adapter so existing
 * `<Avatar><AvatarImage /><AvatarFallback /></Avatar>` call sites keep
 * working. Default chrome stays Brand Book muted (ink tone, no Aurora
 * accent ring). Pass Aurora props (`size`, `status`, `tone`, `ring`)
 * through when a surface needs the full primitive.
 */
import * as React from 'react';
import {
    Avatar as AuroraAvatar,
    AvatarFallback as AuroraAvatarFallback,
    AvatarGroup,
    AvatarImage as AuroraAvatarImage,
    type AvatarProps as AuroraAvatarProps,
} from '@/components/ui/aurora/avatar';

function isElement(
    child: React.ReactNode,
): child is React.ReactElement<Record<string, unknown>> {
    return React.isValidElement(child);
}

function Avatar({
    className,
    children,
    ...props
}: AuroraAvatarProps) {
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
        <AuroraAvatar
            {...props}
            src={src}
            alt={alt}
            initials={initials}
            fallback={initials}
            size={props.size ?? 'md'}
            tone={props.tone ?? 'var(--evosales-ink)'}
            ring={props.ring ?? false}
            className={className}
            style={{ boxShadow: 'none', ...props.style }}
        />
    );
}

function AvatarImage({
    className,
    ...props
}: React.ComponentProps<typeof AuroraAvatarImage>) {
    return <AuroraAvatarImage className={className} {...props} />;
}

function AvatarFallback({
    className,
    ...props
}: React.ComponentProps<typeof AuroraAvatarFallback>) {
    return <AuroraAvatarFallback className={className} {...props} />;
}

export { Avatar, AvatarFallback, AvatarGroup, AvatarImage };
