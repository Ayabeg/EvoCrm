import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MESSAGE_TYPE = 'evosales:oauth';

function openCenteredPopup(url: string): Window | null {
    const width = 520;
    const height = 720;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    const features = `popup=yes,width=${width},height=${height},left=${left},top=${top}`;
    const popup = window.open('about:blank', 'evosales-oauth', features);

    if (popup) {
        popup.location.href = url;

        return popup;
    }

    return window.open(url, 'evosales-oauth', features);
}

export function OAuthPopupButton({
    href,
    children,
    className,
    disabled,
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}) {
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) {
                return;
            }

            if (event.data?.type !== MESSAGE_TYPE) {
                return;
            }

            setBusy(false);
            router.reload();
        };

        window.addEventListener('message', onMessage);

        return () => window.removeEventListener('message', onMessage);
    }, []);

    return (
        <Button
            type="button"
            className={cn(className)}
            disabled={disabled || busy}
            onClick={() => {
                if (disabled || href === '') {
                    return;
                }

                const popup = openCenteredPopup(href);

                if (!popup) {
                    return;
                }

                setBusy(true);
            }}
        >
            {children}
        </Button>
    );
}
