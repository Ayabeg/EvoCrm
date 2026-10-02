import type { ReactNode } from 'react';
import { Callout } from '@/evo/ui/callout';

export default function AuthStatus({ children }: { children: ReactNode }) {
    return (
        <Callout variant="success" className="mb-6 text-start">
            {children}
        </Callout>
    );
}
