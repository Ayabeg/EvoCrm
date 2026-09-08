export function FacebookMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path
                fill="#1877F2"
                d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.03 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.27h3.32l-.53 3.49h-2.79V24C19.61 23.09 24 18.1 24 12.07"
            />
        </svg>
    );
}

export function MetaMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
            <path
                fill="none"
                stroke="#0081FB"
                strokeWidth="3.2"
                strokeLinecap="round"
                d="M7 18c0-4.6 3.6-8 8-8 6 0 7.2 8 11 8 3.6 0 6.5-2.7 6.5-6.2S31.6 6 28 6c-3.8 0-5.8 3.4-8 6.8C17.8 16.2 15.8 20 12 20 8.6 20 7 17.4 7 15"
            />
        </svg>
    );
}

export function InstagramMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <defs>
                <radialGradient id="ig-a" cx="30%" cy="107%" r="150%">
                    <stop offset="0%" stopColor="#fdf497" />
                    <stop offset="45%" stopColor="#fd5949" />
                    <stop offset="60%" stopColor="#d6249f" />
                    <stop offset="90%" stopColor="#285AEB" />
                </radialGradient>
            </defs>
            <rect width="24" height="24" rx="6" fill="url(#ig-a)" />
            <circle
                cx="12"
                cy="12"
                r="4.2"
                fill="none"
                stroke="#fff"
                strokeWidth="1.7"
            />
            <circle cx="17.2" cy="6.8" r="1.1" fill="#fff" />
        </svg>
    );
}

export function WhatsAppMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path
                fill="#25D366"
                d="M12 0C5.37 0 0 5.3 0 11.83c0 2.09.56 4.12 1.63 5.91L0 24l6.45-1.68A12.1 12.1 0 0 0 12 23.66C18.63 23.66 24 18.36 24 11.83 24 5.3 18.63 0 12 0"
            />
            <path
                fill="#fff"
                d="M17.47 14.38c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.33-.8-.71-1.34-1.6-1.5-1.86-.16-.27-.02-.41.12-.54.12-.12.27-.32.41-.48.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.44-.46-.61-.46h-.52c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.35.99 2.66 1.12 2.85.14.18 1.95 2.98 4.72 4.18 1.77.76 2.11.61 2.49.57.38-.04 1.23-.5 1.4-.99.18-.48.18-.9.13-.99-.06-.08-.25-.14-.52-.27"
            />
        </svg>
    );
}

export function WhatsAppBusinessMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path
                fill="#128C7E"
                d="M12 0C5.37 0 0 5.3 0 11.83c0 2.09.56 4.12 1.63 5.91L0 24l6.45-1.68A12.1 12.1 0 0 0 12 23.66C18.63 23.66 24 18.36 24 11.83 24 5.3 18.63 0 12 0"
            />
            <path
                fill="#fff"
                d="M9.1 7.4h5.8c.7 0 1.2.5 1.2 1.2v6.8c0 .7-.5 1.2-1.2 1.2H9.1c-.7 0-1.2-.5-1.2-1.2V8.6c0-.7.5-1.2 1.2-1.2Zm1.1 2.1v.9h3.6v-.9h-3.6Zm0 1.8v.9h3.6v-.9h-3.6Zm0 1.8v.9h2.3v-.9H10.2Z"
            />
        </svg>
    );
}

export function GoogleMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
            />
            <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
            />
            <path
                fill="#FBBC05"
                d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
            />
            <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
            />
        </svg>
    );
}
