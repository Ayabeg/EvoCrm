import { useEffect, useState } from 'react';

export const EVO_DURATION_MICRO_MS = 120;
export const EVO_DURATION_NORMAL_MS = 200;
export const EVO_DURATION_CONTEXT_MS = 240;
export const EVO_EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(prefersReducedMotion);

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = () => {
            setReduced(media.matches);
        };

        onChange();
        media.addEventListener('change', onChange);

        return () => {
            media.removeEventListener('change', onChange);
        };
    }, []);

    return reduced;
}
