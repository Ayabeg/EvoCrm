Your Lead Leakage Calculator estimate

Hi {{ $recipientName }}, here is the estimate calculated from the assumptions you supplied.

Potential value at risk: {{ number_format((float) ($result['estimated_revenue_at_risk'] ?? 0), 2, ',', ' ') }} DZD
Inquiries lost: {{ number_format((float) ($result['total_lost_inquiries'] ?? 0), 2, ',', ' ') }}
Leakage rate: {{ number_format((float) ($result['leakage_rate_percent'] ?? 0), 2, ',', ' ') }}%

This is an estimate based only on your inputs. It is not a measured result, financial advice, or a guarantee of savings.

{{ $workspaceName }} · EvoCrm
