<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>EvoSales · Evotechly</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f7f6;font-family:Arial,Helvetica,sans-serif;color:#111111;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
        <div style="background-color:#000000;border-radius:12px 12px 0 0;padding:20px 28px;">
            <span style="color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:0.2px;">EvoSales</span>
            <span style="color:#EC6025;font-size:16px;font-weight:bold;">&nbsp;·&nbsp;Evotechly</span>
        </div>
        <div style="background-color:#ffffff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;padding:32px 28px;">
            <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#111111;">You're invited, {{ $inviteeName }}</h1>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#525252;">
                {{ $inviterName }} added you to the <strong style="color:#111111;">{{ $workspaceName }}</strong> workspace on EvoSales — Evotechly's sales OS.
            </p>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#525252;">
                Set your password to activate your login. This first-login link expires and can only be used once.
            </p>
            <p style="margin:0 0 24px;">
                <a href="{{ $inviteUrl }}" style="display:inline-block;background-color:#EC6025;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 24px;border-radius:8px;">Set your password</a>
            </p>
            <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#525252;">
                Button not working? Paste this link into your browser:
            </p>
            <p style="margin:0 0 24px;font-size:12px;line-height:1.6;word-break:break-all;">
                <a href="{{ $inviteUrl }}" style="color:#EC6025;">{{ $inviteUrl }}</a>
            </p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#a3a3a3;">
                We never email you a password. If you weren't expecting this invite, you can ignore this email — the link only sets a password you choose.
            </p>
        </div>
        <p style="margin:16px 0 0;font-size:11px;color:#a3a3a3;text-align:center;">EvoSales · Evotechly</p>
    </div>
</body>
</html>
