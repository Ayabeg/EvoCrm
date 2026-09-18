import { useState } from 'react';
import { Button } from '@/components/ui/button';

type WebhookCallback = {
    configured: boolean;
    masked_url: string;
    can_reveal: boolean;
    reveal_url: string;
    last_received_at?: string | null;
};

function csrfHeaders(): Record<string, string> {
    const meta = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');

    if (meta) {
        return { 'X-CSRF-TOKEN': meta };
    }

    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);

    return match
        ? { 'X-XSRF-TOKEN': decodeURIComponent(match[1]) }
        : {};
}

async function fetchCallbackUrl(revealUrl: string): Promise<string | null> {
    const response = await fetch(revealUrl, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...csrfHeaders(),
        },
        credentials: 'same-origin',
    });

    if (!response.ok) {
        return null;
    }

    const payload = (await response.json()) as { url?: string };

    return typeof payload.url === 'string' && payload.url.length > 0
        ? payload.url
        : null;
}

export function SecretCallbackField({
    callback,
}: {
    callback: WebhookCallback;
}) {
    const [revealed, setRevealed] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const display = revealed ?? callback.masked_url;

    async function reveal() {
        if (!callback.can_reveal) {
            return;
        }

        setBusy(true);
        setError(null);

        const url = await fetchCallbackUrl(callback.reveal_url);
        setBusy(false);

        if (!url) {
            setError('Could not reveal the callback. Ask a workspace admin.');

            return;
        }

        setRevealed(url);
    }

    async function copy() {
        if (!callback.can_reveal) {
            return;
        }

        setBusy(true);
        setError(null);

        const url = revealed ?? (await fetchCallbackUrl(callback.reveal_url));
        setBusy(false);

        if (!url) {
            setError('Could not copy the callback. Ask a workspace admin.');

            return;
        }

        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="grid min-w-0 gap-2" data-settings="secret-callback">
            <p className="text-[12px] text-mute">
                Treat this callback as a secret. Meta needs the full URL,
                including the workspace key. Official lead payloads still
                require the app signature. Rotation is not available.
            </p>
            <code className="block max-w-full overflow-hidden rounded-[4px] border border-hairline bg-canvas-soft px-3 py-2 font-mono text-[12px] break-all text-ink">
                {display}
            </code>
            {callback.can_reveal ? (
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                            void (revealed ? setRevealed(null) : reveal());
                        }}
                    >
                        {revealed ? 'Hide' : 'Reveal'}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                            void copy();
                        }}
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </Button>
                </div>
            ) : (
                <p className="text-[12px] text-mute">
                    Configured. Ask a workspace admin to reveal or copy this
                    callback for the Meta App Dashboard.
                </p>
            )}
            {error ? (
                <p className="text-[12px] text-destructive">{error}</p>
            ) : null}
            {callback.last_received_at ? (
                <p className="text-[12px] text-mute">
                    Last received{' '}
                    {new Date(callback.last_received_at).toLocaleString(
                        'en-GB',
                    )}
                </p>
            ) : (
                <p className="text-[12px] text-mute">
                    No webhook received yet. This is not a health check.
                </p>
            )}
        </div>
    );
}
