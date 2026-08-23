<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Unsubscribe · EvoSales · Evotechly</title>
    <link rel="icon" href="/brand/evotechly/mark.svg" type="image/svg+xml">
    <style>
        body { font-family: Geist, "Geist Sans", ui-sans-serif, system-ui, sans-serif; background: #F0F5FA; color: #0D1B24; display: grid; place-items: center; min-height: 100vh; margin: 0; }
        main { max-width: 32rem; padding: 2rem; background: #FFFFFF; border: 1px solid #E3E8EE; border-radius: 0.5rem; }
        h1 { margin-top: 0; }
        a { color: #0F4C5C; }
    </style>
</head>
<body>
    <main>
        <p style="display:flex;align-items:center;gap:0.5rem;margin:0 0 1rem;">
            <img src="/brand/evotechly/mark.svg" alt="Evotechly" width="28" height="28">
            <strong>EvoSales · Evotechly</strong>
        </p>
        <h1>Unsubscribe</h1>
        @if ($ok)
            <p>You have been added to the workspace suppression list. Evotechly will not send further automated outbound to this address or number.</p>
        @else
            <p>Provide <code>?email=</code> or <code>?phone=</code> to be suppressed. Quiet hours and suppression apply to Outbound Center only.</p>
        @endif
    </main>
</body>
</html>
