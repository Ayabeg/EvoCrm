<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Unsubscribe — EvoSales</title>
    <style>
        body { font-family: ui-sans-serif, system-ui, sans-serif; background: #0f172a; color: #e2e8f0; display: grid; place-items: center; min-height: 100vh; margin: 0; }
        main { max-width: 32rem; padding: 2rem; background: #1e293b; border-radius: 1rem; }
        h1 { margin-top: 0; }
        a { color: #5eead4; }
    </style>
</head>
<body>
    <main>
        <h1>EvoSales unsubscribe</h1>
        @if ($ok)
            <p>You have been added to the workspace suppression list. Evotechly will not send further automated outbound to this address or number.</p>
        @else
            <p>Provide <code>?email=</code> or <code>?phone=</code> to be suppressed. Quiet hours and suppression apply to Outbound Center only.</p>
        @endif
    </main>
</body>
</html>
