<!DOCTYPE html>
<html lang="{{ \App\Support\Locale::htmlLang(app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Lead Leakage Calculator</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f7f6;font-family:Arial,Helvetica,sans-serif;color:#111111;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
        <div style="background-color:#000000;border-radius:12px 12px 0 0;padding:20px 28px;">
            <span style="color:#ffffff;font-size:16px;font-weight:bold;">EvoCrm</span>
            <span style="color:#E8530E;font-size:16px;font-weight:bold;">&nbsp;·&nbsp;Evotechly</span>
        </div>
        <div style="background-color:#ffffff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;padding:32px 28px;">
            <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">Your Lead Leakage Calculator estimate</h1>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#525252;">Hi {{ $recipientName }}, here is the estimate calculated from the assumptions you supplied.</p>
            <p style="margin:0 0 8px;font-size:14px;color:#525252;">Potential value at risk</p>
            <p style="margin:0 0 24px;font-size:28px;font-weight:bold;color:#E8530E;">{{ number_format((float) ($result['estimated_revenue_at_risk'] ?? 0), 2, ',', ' ') }} DZD</p>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;">Inquiries lost: <strong>{{ number_format((float) ($result['total_lost_inquiries'] ?? 0), 2, ',', ' ') }}</strong></p>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;">Leakage rate: <strong>{{ number_format((float) ($result['leakage_rate_percent'] ?? 0), 2, ',', ' ') }}%</strong></p>
            <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#777777;">This is an estimate based only on your inputs. It is not a measured result, financial advice, or a guarantee of savings.</p>
        </div>
        <p style="margin:16px 0 0;font-size:11px;color:#a3a3a3;text-align:center;">{{ $workspaceName }} · EvoCrm</p>
    </div>
</body>
</html>
