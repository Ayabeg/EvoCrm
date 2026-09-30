@php
    $appearance = request()->cookie('appearance', 'system');
    $appearance = in_array($appearance, ['light', 'dark', 'system'], true) ? $appearance : 'system';
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => $appearance === 'dark']) @if ($appearance === 'dark') data-theme="dark" @endif>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- class="dark" is stamped server-side only for an explicit Dark choice.
             localStorage + system preference run here before first paint so
             the cabinet cannot flash the wrong theme. --}}
        <script>
            (function () {
                const appearance = @json($appearance);
                let resolved = appearance;
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
            html {
                background-color: #F7F7F5;
            }

            html.dark {
                background-color: #121212;
            }
        </style>

        <link rel="icon" href="/brand/evocrm/logo.svg" type="image/svg+xml">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any">
        <link rel="apple-touch-icon" href="/brand/evocrm/logo.svg">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
