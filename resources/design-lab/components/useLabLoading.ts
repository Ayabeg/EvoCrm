import { useEffect, useState } from 'react';

export function useLabLoading(ms = 280): boolean {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setLoading(false);
        }, ms);

        return () => {
            window.clearTimeout(timer);
        };
    }, [ms]);

    return loading;
}
