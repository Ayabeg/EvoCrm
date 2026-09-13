@php
    $appearance = request()->cookie('appearance', 'system');
    $appearance = in_array($appearance, ['light', 'dark', 'system'], true) ? $appearance : 'system';
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => $appearance === 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- class="dark" is stamped server-side only for an explicit Dark choice.
             System followers get it here before first paint to avoid a flash. --}}
        <script>
            (function () {
                const appearance = @json($appearance);
                const dark =
                    appearance === 'dark' ||
                    (appearance === 'system' &&
                        window.matchMedia('(prefers-color-scheme: dark)').matches);

                document.documentElement.classList.toggle('dark', dark);
                document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
            })();
        </script>

        <style>
            html {
                background-color: #eaeaea;
            }

            html.dark {
                background-color: #000000;
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
