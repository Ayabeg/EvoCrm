<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Connected</title>
</head>
<body>
    <p>You can close this window.</p>
    <script>
        (function () {
            var payload = {
                type: 'evosales:oauth',
                provider: @json($provider),
                ok: @json($ok)
            };

            if (window.opener) {
                window.opener.postMessage(payload, window.location.origin);
            }

            window.close();
        })();
    </script>
</body>
</html>
