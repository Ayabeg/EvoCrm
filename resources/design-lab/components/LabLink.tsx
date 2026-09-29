import type { MouseEvent, ReactNode } from 'react';
import { labHref, navigateLab } from '../lib/routes';
import type { LabRoute } from '../lib/routes';

type Props = {
    to: LabRoute;
    children: ReactNode;
    className?: string;
};

export function LabLink({ to, children, className }: Props) {
    return (
        <a
            href={labHref(to)}
            className={className}
            onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
                    return;
                }

                event.preventDefault();
                navigateLab(to);
            }}
        >
            {children}
        </a>
    );
}
