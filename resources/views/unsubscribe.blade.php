<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Unsubscribe · EvoSales · Evotechly</title>
    <link rel="icon" href="/brand/evocrm/logo.svg" type="image/svg+xml">
    <style>
        body { font-family: Geist, "Geist Sans", ui-sans-serif, system-ui, sans-serif; background: #F7F7F5; color: #161616; display: grid; place-items: center; min-height: 100vh; margin: 0; }
        main { max-width: 32rem; padding: 2rem; background: #FFFFFF; border: 1px solid #E5E5E5; border-radius: 0.5rem; }
        h1 { margin-top: 0; }
        a { color: #E8530E; }
    </style>
</head>
<body>
    <main>
        <p style="display:flex;align-items:center;gap:0.5rem;margin:0 0 1rem;">
            <img src="/brand/evocrm/logo.svg" alt="EvoCrm" width="28" height="28">
            <strong>EvoCrm</strong>
        </p>
        <h1>Unsubscribe</h1>
        @if ($ok)
            <p>You have been added to the workspace suppression list. Evotechly will not send further automated outbound to this address or number.</p>
        @else
            <p>Confirm below to stop further automated outbound to this address or number.</p>
            <form method="POST" action="{{ $confirmUrl }}">
                @csrf
                <button type="submit">Unsubscribe</button>
            </form>
        @endif
    </main>
</body>
</html>
