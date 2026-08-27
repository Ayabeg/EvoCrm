import type { ReactNode } from 'react';
import { Callout } from '@/components/ui/aurora/callout';

export default function AuthStatus({ children }: { children: ReactNode }) {
    return (
        <Callout variant="success" className="mb-6 text-left">
            {children}
        </Callout>
    );
}
