@php
    $appearance = request()->cookie('appearance', 'system');
    $appearance = in_array($appearance, ['light', 'dark', 'system'], true) ? $appearance : 'system';
    $htmlLocale = \App\Support\Locale::htmlLang(app()->getLocale());
    $htmlDir = \App\Support\Locale::direction($htmlLocale);
@endphp
<!DOCTYPE html>
<html lang="{{ $htmlLocale }}" dir="{{ $htmlDir }}" @class(['dark' => $appearance === 'dark']) @if ($appearance === 'dark') data-theme="dark" @endif>
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

                let locale = @json($htmlLocale);
                try {
                    const storedLocale = localStorage.getItem('locale');
                    if (storedLocale === 'fr' || storedLocale === 'en' || storedLocale === 'ar') {
                        locale = storedLocale;
                    }
                } catch (e) {}

                document.documentElement.lang = locale;
                document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
                document.documentElement.dataset.locale = locale;
            })();
        </script>

        <style>
            html {
                background-color: #FBFBF9;
            }

            html.dark {
                background-color: #050505;
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
