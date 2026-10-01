<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>EvoCRM Design Lab</title>
        <link rel="icon" href="/brand/evocrm/logo.svg" type="image/svg+xml">
        <script>
            (function () {
                let resolved = 'system';
                try {
                    const stored = localStorage.getItem('appearance');
                    if (stored === 'light' || stored === 'dark' || stored === 'system') {
                        resolved = stored;
                    } else {
                        const match = document.cookie.match(/(?:^|;\s*)appearance=([^;]*)/);
                        const cookie = match ? decodeURIComponent(match[1]) : '';
                        if (cookie === 'light' || cookie === 'dark' || cookie === 'system') {
                            resolved = cookie;
                        }
                    }
                } catch (e) {}
                const dark =
                    resolved === 'dark' ||
                    (resolved === 'system' &&
                        window.matchMedia('(prefers-color-scheme: dark)').matches);
                document.documentElement.classList.toggle('dark', dark);
                document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
                document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
            })();
        </script>
        <style>
            html { background: #F7F8F5; }
            html.dark { background: #0A0A0A; }
        </style>
        @vite(['resources/design-lab/design-lab.css', 'resources/design-lab/main.tsx'])
    </head>
    <body>
        <div id="design-lab-root"></div>
    </body>
</html>
